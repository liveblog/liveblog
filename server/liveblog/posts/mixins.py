import logging
from flask import request, current_app as app
from bson.objectid import ObjectId

from eve_elastic.elastic import ElasticCursor
from superdesk import get_resource_service
from superdesk.resource import build_custom_hateoas
from settings import MOBILE_APP_WORKAROUND
from liveblog.polls.polls import poll_calculations
from . import utils as post_utils
from .utils import get_associations

logger = logging.getLogger("superdesk")

AGENT_MOBILE_ANDROID = "okhttp/"
AGENT_MOBILE_IOS = "org.sourcefabric.LiveBlogReporter"
AGENT_MOBILE_GENERIC = "cz.adminit.liveblog"


class AuthorsMixin:
    """
    Class mixin to provide helpers function to extract authors, hit database once
    and attach information to given posts and inner items
    """

    authors_list = []
    authors_map = {}

    def complete_posts_info(self, posts):
        """
        Calculates the post types for each given post. Attaches the syndicated post information if needed.
        Retrieves authors information from database in a performant way and set it to posts.
        """
        for doc in posts:
            post_utils.calculate_post_type(doc)
            post_utils.attach_syndication(doc)

            self.extract_author_ids(doc)

        # now let's add authors' information
        self.generate_authors_map()
        self.attach_authors(posts)

    def extract_author_ids(self, doc, items=None):
        """
        Users collection will be used many times if pulling authors one by one
        so we need to get all the IDs, store them in an object and hit DB once per request
        """

        def _append_author(item):
            author_id = item.get("original_creator", None)

            try:
                if isinstance(author_id, dict):
                    author_id = author_id.get("_id", "")

                # author_id might be an empty string, for instance when the post is syndicated_in
                # for this case we use the syndicated_creator in `attach_authors` method
                if author_id:
                    author_id = ObjectId(author_id)
                    self.authors_list.append(author_id)
            except Exception as err:
                logger.info("Unable to add author id to map. {}".format(err))

        items = items or post_utils.get_related_items(doc)
        for item in items:
            _append_author(item)

        # author info from the post so we can post.original_creator.X - LBSD-2010
        _append_author(doc)

        return doc

    def generate_authors_map(self):
        """
        Gets users information from database based on a list of predefined ids
        The idea behind the method is to reduce the impact on DB. Make sure to call
        `extract_author_ids` method before this one.
        """
        ids = set(self.authors_list)

        for user in get_resource_service("liveblog_users").find({"_id": {"$in": ids}}):
            author_id = str(user.get("_id"))
            self.authors_map[author_id] = user

    def _is_mobile_app(self):
        if not MOBILE_APP_WORKAROUND:
            return False

        try:
            user_agent = request.user_agent.string
            logger.debug("Looking for user agent mobile app %s" % user_agent)

            is_mobile_app = any(
                [
                    (AGENT_MOBILE_IOS in user_agent),
                    (AGENT_MOBILE_GENERIC in user_agent),
                    (AGENT_MOBILE_ANDROID in user_agent),
                ]
            )
        except RuntimeError:
            # RuntimeError happens when out of the context
            # it will be thrown when running celery tasks to update blog in S3
            # so we don't care about the mobile app thing.
            is_mobile_app = False

        return is_mobile_app

    def _set_by_line(self, post, author_dict):
        """
        This is a temporary workaround for mobile app. They should use our new approach
        which is attaches the whole user info in the `original_creator` attribute. This is not
        used by the webapp
        """

        if not self._is_mobile_app():
            return

        # by now, the original_creator has been set for a syndicated_in post
        # so we are fine when using original_creator instead of syndicated_creator
        creator = author_dict

        if not post.get("byline") and isinstance(creator, dict):
            byline = creator.get("byline")
            if not byline:
                byline = creator.get("display_name")

            post["byline"] = byline

    def attach_authors(self, posts):
        """Simply gets author id from items related and for post itself and adds author info"""

        is_mobile_app = self._is_mobile_app()

        for post in posts:
            post_author_id = str(post.get("original_creator", "__not_found__"))
            original_creator = self.authors_map.get(post_author_id)
            first_item = post_utils.get_first_item(post)

            if not original_creator:
                item_type = first_item.get("item_type")

                if item_type == "comment":
                    original_creator = {
                        "display_name": first_item.get("commenter"),
                        "_id": None,
                    }

                elif item_type == "post_comment":
                    original_creator = {
                        "display_name": first_item.get("author_name"),
                        "_id": None,
                    }

                elif post.get("syndication_in"):
                    # get the syndicated_creator from post, otherwise grab it from item (fallback for previous logic)
                    first_item_author = first_item.get("syndicated_creator", {})
                    original_creator = post.get("syndicated_creator", first_item_author)

            post["original_creator"] = (
                original_creator.get("_id") if is_mobile_app else original_creator
            )

            self._set_by_line(post, original_creator)

            # TODO: check if we really need to complete items' author info. Most likely is only needed for post
            items_refs = [
                assoc
                for group in post.get("groups", [])
                for assoc in group.get("refs", [])
            ]

            for ref in items_refs:
                item = ref.get("item")
                if item and "original_creator" in item:
                    author_id = str(item["original_creator"])
                    item["original_creator"] = (
                        author_id if is_mobile_app else self.authors_map.get(author_id)
                    )


class BlogPostsMixin:
    """
    Shared post-enrichment logic for both the authenticated (BlogPostsService)
    and public (ClientBlogPostsService) blog posts endpoints.
    """

    custom_hateoas = {"self": {"title": "Posts", "href": "/{location}/{_id}"}}

    def related_items_map(self, docs):
        """
        Receives an array of posts, extracts their associations' IDs, hits the
        database once per resource and returns them as a {residRef: item} dict.
        """
        items_map = {}
        ids_by_service = {}

        for doc in docs:
            for assoc in self.packageService._get_associations(doc):
                item_ref_id = assoc.get("residRef")
                if item_ref_id:
                    service_name = assoc.get("location", "archive")
                    ids = ids_by_service.get(service_name, [])
                    ids.append(item_ref_id)
                    ids_by_service[service_name] = ids

        for service_name, ids in ids_by_service.items():
            for item in get_resource_service(service_name).find({"_id": {"$in": ids}}):
                items_map[str(item.get("_id"))] = item

        return items_map

    def remove_post_from_list_and_db(self, docs, post):
        if app.config.get("SUPERDESK_TESTING", False):
            return

        self.delete(lookup={"_id": post["_id"]})

        try:
            if isinstance(docs, ElasticCursor):
                docs.docs.remove(post)
            else:
                docs.remove(post)
        except Exception as e:
            logger.warning(f"Failed to remove orphan doc: {post}. Error: {e}")

    def remove_orphan_items(self, docs):
        """Removes posts whose items are missing from the related_items map."""
        for post in docs:
            posts_items = []

            for group in post.get("groups", []):
                if group.get("id") == "main":
                    posts_items = group.get("refs", [])

            if len(posts_items) == 0:
                self.remove_post_from_list_and_db(docs, post)

            for assoc in get_associations(post):
                if "deleted" in assoc:
                    if (
                        len(post["groups"]) > 0
                        and "refs" in post["groups"][1]
                        and len(post["groups"][1]["refs"]) == 1
                    ):
                        self.remove_post_from_list_and_db(docs, post)

                    try:
                        post["groups"][1]["refs"].remove(assoc)
                    except Exception as e:
                        logger.warning(
                            f"Failed to remove orphan item: {assoc}. Error: {e}"
                        )

    def _enrich_blog_posts(self, docs):
        """
        Attach related items, resolve poll calculations, and enrich author
        information for all posts in docs. Mutates docs in place.
        """
        related_items = self.related_items_map(docs)

        for doc in docs:
            build_custom_hateoas(self.custom_hateoas, doc, location="posts")

            for assoc in get_associations(doc):
                ref_id = assoc.get("residRef", None)

                # not in related_items means it's a deleted item — mark it so
                # remove_orphan_items can clean it up
                if ref_id and ref_id not in related_items:
                    assoc["deleted"] = True
                    continue

                if ref_id:
                    assoc["item"] = related_items[ref_id]
                    if assoc.get("type") == "poll":
                        assoc["item"]["poll_body"] = poll_calculations(
                            assoc["item"]["poll_body"]
                        )

            self.extract_author_ids(doc)

        # NOTE: temporary workaround for broken references
        # TODO: remove this after two releases from now
        self.remove_orphan_items(docs)

        self.generate_authors_map()
        self.attach_authors(docs)
