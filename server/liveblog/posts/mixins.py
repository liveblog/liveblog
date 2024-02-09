import logging
from flask import request
from bson.objectid import ObjectId

from superdesk import get_resource_service
from settings import MOBILE_APP_WORKAROUND
from . import utils as post_utils

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

                # author_id might be an empty string, for instance when the post is syndicated in
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

        for user in get_resource_service("users").find({"_id": {"$in": ids}}):
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
            main_item = post_utils.get_main_item(post)

            if not original_creator:
                item_type = main_item.get("item_type")

                if item_type == "comment":
                    original_creator = {
                        "display_name": main_item.get("commenter"),
                        "_id": None,
                    }

                elif item_type == "post_comment":
                    original_creator = {
                        "display_name": main_item.get("author_name"),
                        "_id": None,
                    }

                elif post.get("syndication_in"):
                    original_creator = main_item.get("syndicated_creator", {})

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
