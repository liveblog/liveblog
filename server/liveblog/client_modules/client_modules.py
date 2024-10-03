import json
import logging

from distutils.util import strtobool
from eve.utils import config, date_to_str
from eve.io.base import DataLayer
from flask_cors import CORS
from flask import Blueprint, request
from flask import current_app as app
from werkzeug.datastructures import MultiDict
from superdesk import get_resource_service
from superdesk.utc import utcnow

from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.errors import SuperdeskApiError
from superdesk.users.users import UsersResource
from superdesk.metadata.utils import item_url

from liveblog.blogs.blogs import BlogsResource
from liveblog.advertisements.collections import CollectionsService, CollectionsResource
from liveblog.advertisements.outputs import OutputsService, OutputsResource
from liveblog.advertisements.advertisements import (
    AdvertisementsService,
    AdvertisementsResource,
)
from liveblog.posts.posts import (
    PostsService,
    PostsResource,
    BlogPostsService,
    BlogPostsResource,
)
from liveblog.items.items import ItemsResource, ItemsService
from liveblog.polls.polls import PollsResource, PollsService, poll_calculations
from liveblog.common import check_comment_length
from liveblog.blogs.blog import Blog
from liveblog.posts.mixins import AuthorsMixin
from liveblog.posts import utils as post_utils
from liveblog.utils.api import api_error, api_response


blog_posts_blueprint = Blueprint("blog_posts", __name__)
CORS(blog_posts_blueprint)
logger = logging.getLogger(__name__)


class ClientUsersResource(Resource):
    datasource = {
        "source": "users",
        "projection": {
            "password": 0,
            "avatar": 0,
            "renditions": 0,
            "email": 0,
            "role": 0,
            "session_preferences": 0,
            "user_preferences": 0,
            "user_type": 0,
            "is_active": 0,
            "is_enabled": 0,
            "last_name": 0,
            "first_name": 0,
            "sign_off": 0,
            "needs_activation": 0,
            "_created": 0,
            "_updated": 0,
            "_etag": 0,
            "dateline_source": 0,
            "username": 0,
        },
    }

    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    schema = {}
    schema.update(UsersResource.schema)
    schema.update(
        {
            "current_url": {"type": "string", "nullable": True},
        }
    )


class ClientUsersService(BaseService):
    def get(self, req, lookup):
        config.IF_MATCH = False
        return super().get(req, lookup)


class ClientBlogsResource(BlogsResource):
    datasource = {"source": "blogs", "default_sort": [("_updated", -1)]}
    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    schema = {}
    schema.update(BlogsResource.schema)


class ClientBlogsService(BaseService):
    pass


class ClientPostsResource(PostsResource):
    datasource = {
        "source": "archive",
        "elastic_filter": {"term": {"particular_type": "post"}},
        "default_sort": [("order", -1)],
    }
    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    schema = {}
    schema.update(PostsResource.schema)


class ClientPostsService(PostsService, AuthorsMixin):
    def find_one(self, req, **lookup):
        post = super().find_one(req, **lookup)
        if not post:
            return None

        post_utils.calculate_post_type(post)
        post_utils.attach_syndication(post)
        self.complete_posts_info([post])
        return post


class ClientCollectionsResource(CollectionsResource):
    datasource = {"source": "collections", "default_sort": [("name", 1)]}
    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    schema = {}
    schema.update(CollectionsResource.schema)


class ClientCollectionsService(CollectionsService):
    pass


class ClientOutputsResource(OutputsResource):
    datasource = {"source": "outputs", "default_sort": [("name", 1)]}
    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    schema = {}
    schema.update(OutputsResource.schema)


class ClientOutputsService(OutputsService):
    pass


class ClientAdvertisementsResource(AdvertisementsResource):
    datasource = {"source": "advertisements", "default_sort": [("name", 1)]}
    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    schema = {}
    schema.update(AdvertisementsResource.schema)


class ClientAdvertisementsService(AdvertisementsService):
    pass


class ClientItemsResource(ItemsResource):
    datasource = {
        "source": "archive",
        "elastic_filter": {"term": {"particular_type": "item"}},
        "default_sort": [("order", -1)],
    }
    public_methods = ["GET", "POST"]
    public_item_methods = ["GET", "POST"]
    item_methods = ["GET"]
    resource_methods = ["GET", "POST"]
    schema = {"client_blog": Resource.rel("client_blogs", True)}
    schema.update(ItemsResource.schema)


class ClientItemsService(ItemsService):
    def on_create(self, docs):
        for doc in docs:
            check_comment_length(doc["text"])
        super().on_create(docs)


class ClientPollsResource(PollsResource):
    datasource = {
        "source": "polls",
        "elastic_filter": {"term": {"particular_type": "poll"}},
        "default_sort": [("order", -1)],
    }
    public_methods = ["GET", "PATCH"]
    public_item_methods = ["GET", "PATCH"]
    item_methods = ["GET", "PATCH"]
    resource_methods = ["GET"]
    schema = {"client_blog": Resource.rel("client_blogs", True)}
    schema.update(PollsResource.schema)


class ClientPollsService(PollsService):
    """
    This service handles client polls, enabling vote updates.
    Voting operations currently rely on the PATCH method to update resources.

    **TODO:**

    * Use a custom voting endpoint to allow the use of `rate_limit` decorator
    """

    def update(self, id, updates, original):
        """
        Updates a poll document with the provided updates and ensures ETag consistency.

        The `_etag` from the original document is copied into the `updates` because the PATCH request goes
        through an internal patch command that would otherwise generate a new ETag. By copying the last ETag
        manually, we ensure that the `system_update` uses the original ETag for consistency in update behavior.
        """
        updates["_etag"] = original.get("_etag")

        try:
            self.system_update(id, updates, original)
        except DataLayer.OriginalChangedError:
            poll = self.find_one(req=None, _id=id)
            self.system_update(id, updates, poll)

    def on_updated(self, updates, original):
        """
        Performs actions when a poll has been successfully updated.

        After updating the poll, this method checks for any associated client posts that reference the updated
        poll and updates the `content_updated_date` for these posts to reflect that the
        poll content has changed. This then ensures the clients get the poll updates on the embeds
        """
        super().on_updated(updates, original)

        poll_id = str(original.get("_id"))
        blog_id = original.get("blog")

        for post in get_resource_service("client_posts").find(
            {"blog": blog_id, "particular_type": "post"}
        ):
            for assoc in post_utils.get_associations(post):
                if assoc.get("residRef") == poll_id:
                    updated_post = post.copy()
                    updated_post["content_updated_date"] = utcnow()
                    get_resource_service("posts").update(
                        post.get("_id"), updated_post, post
                    )
                    app.blog_cache.invalidate(blog_id)


class ClientCommentsResource(PostsResource):
    datasource = {
        "source": "archive",
        "elastic_filter": {"term": {"particular_type": "post"}},
        "default_sort": [("order", -1)],
    }
    public_methods = ["GET", "POST"]
    public_item_methods = ["GET", "POST"]
    item_methods = ["GET"]
    resource_methods = ["GET", "POST"]
    schema = {
        "client_blog": Resource.rel("client_blogs", True),
        "blog": {"type": "string"},
    }
    schema.update(PostsResource.schema)


class ClientCommentsService(PostsService):
    def on_create(self, docs):
        for doc in docs:
            if request.method == "POST":
                doc["post_status"] = "comment"
                # blog_id is kept also under the name blog as a string
                # so that it can be further used to auto-refresh the back-office
                doc["blog"] = str(doc["client_blog"])
        super().on_create(docs)


class ClientBlogPostsResource(BlogPostsResource):
    url = 'client_blogs/<regex("[a-f0-9]{24}"):blog_id>/posts'
    schema = PostsResource.schema
    datasource = {
        "source": "archive",
        "elastic_filter": {"term": {"particular_type": "post"}},
        "default_sort": [("order", -1)],
    }
    public_methods = ["GET"]
    public_item_methods = ["GET"]
    item_methods = ["GET"]
    resource_methods = ["GET"]
    privileges = {"GET": "blogs"}
    item_url = item_url


class ClientBlogPostsService(BlogPostsService, AuthorsMixin):
    def get(self, req, lookup):
        allowed_params = {
            "start_date",
            "end_date",
            "include_fields",
            "exclude_fields",
            "max_results",
            "page",
            "version",
            "where",
            "q",
            "default_operator",
            "filter",
            "service",
            "subject",
            "genre",
            "urgency",
            "priority",
            "type",
            "item_source",
            "source",
        }

        # check for unknown query parameters
        _check_for_unknown_params(request, allowed_params)

        sufix = hash(json.dumps(req.__dict__, sort_keys=True))
        cache_key = "lb_ClientBlogPostsService_get_%s" % sufix
        blog_id = lookup.get("blog_id")

        # ElasticCursor is returned so we can loop and modify docs inside
        blog_posts = app.blog_cache.get(blog_id, cache_key)

        if blog_posts is None:
            new_args = req.args.copy()
            query_source = json.loads(new_args.get("source", "{}"))

            post_filter = query_source.setdefault("post_filter", {})
            filter_must = post_filter.setdefault("bool", {}).setdefault("must", [])

            for must_el in filter_must:
                if "range" in must_el:
                    must_el["range"]["published_date"] = {"lte": date_to_str(utcnow())}
                    break
            else:
                filter_must.append(
                    {"range": {"published_date": {"lte": date_to_str(utcnow())}}}
                )

            new_args["source"] = json.dumps(query_source)
            req.args = new_args

            blog_posts = super().get(req, lookup)

            # let's complete the post info before cache
            for post in blog_posts.docs:
                post_utils.calculate_post_type(post)
                post_utils.attach_syndication(post)

            app.blog_cache.set(blog_id, cache_key, blog_posts)

        return blog_posts

    def on_fetched(self, blog):
        """Parent's class attach editing flag information so, we don't need it
        for frontend. Let's override the method with empty block"""
        pass


class ClientOutputPostsResource(ClientBlogPostsResource):
    url = 'client_blogs/<regex("[a-f0-9]{24}"):blog_id>/<regex("[a-f0-9]{24}"):output_id>/posts'


class ClientOutputPostsService(ClientBlogPostsService):
    def get(self, req, lookup):
        output = get_resource_service("outputs").find_one(
            req=None, _id=lookup.get("output_id")
        )
        if not output:
            raise SuperdeskApiError.notFoundError(message="output not found")

        output_tags = output.get("tags", [])

        if len(output_tags) > 0:
            new_args = req.args.copy()
            query_source = json.loads(new_args.get("source", "{}"))

            post_filter = query_source.setdefault("post_filter", {})
            must_filters = post_filter.setdefault("bool", {}).setdefault("must", [])

            # In case the request is provided with tags to filter the content, we loop
            # through the elastic `terms` query and check the tags
            isRequestFilteredByTags = len(must_filters) > 0

            if isRequestFilteredByTags:
                for must in must_filters:
                    if "terms" in must:
                        query_tags = must["terms"].get("tags", [])

                        if len(query_tags) == 0:
                            must["terms"] = {"tags": output_tags}
                        else:
                            must["terms"] = {
                                "tags": _filter_allowed_tags(query_tags, output_tags)
                            }
                        break
            else:
                # If not, then let's just add the tags from which are limiting the output channel
                must_filters.append({"terms": {"tags": output_tags}})

            new_args["source"] = json.dumps(query_source)
            req.args = new_args

        del lookup["output_id"]

        return super().get(req, lookup)


def _filter_allowed_tags(query_tags, output_tags):
    """
    Checks the tags coming from query against the ones set in
    the output channel's setting to display only the allowed content
    """

    return [x for x in query_tags if x in output_tags]


def _check_for_unknown_params(request, whitelist, allow_filtering=True):
    """Check if the request contains only allowed parameters.

    :param req: object representing the HTTP request
    :type req: `eve.utils.ParsedRequest`
    :param whitelist: iterable containing the names of allowed parameters.
    :param bool allow_filtering: whether or not the filtering parameter is
        allowed (True by default). Used for disallowing it when retrieving
        a single object.

    :raises SuperdeskApiError.badRequestError:
        * if the request contains a parameter that is not whitelisted
        * if the request contains more than one value for any of the
            parameters
    """
    if not request or not getattr(request, "args"):
        return
    request_params = request.args or MultiDict()

    if not allow_filtering:
        err_msg = (
            "Filtering{} is not supported when retrieving a "
            'single object (the "{param}" parameter)'
        )

        if "start_date" in request_params.keys():
            message = err_msg.format(" by date range", param="start_date")
            raise SuperdeskApiError.badRequestError(message=message)

        if "end_date" in request_params.keys():
            message = err_msg.format(" by date range", param="end_date")
            raise SuperdeskApiError.badRequestError(message=message)

    for param_name in request_params.keys():
        if param_name not in whitelist:
            raise SuperdeskApiError.badRequestError(
                message="Unexpected parameter ({})".format(param_name)
            )

        if len(request_params.getlist(param_name)) > 1:
            message = "Multiple values received for parameter ({})"
            raise SuperdeskApiError.badRequestError(message=message.format(param_name))


@blog_posts_blueprint.route("/api/client_item_comments/", methods=["POST"])
def create_amp_comment():
    data = request.values
    check_comment_length(data["text"])

    item_data = dict()
    item_data["text"] = data["text"]
    item_data["commenter"] = data["commenter"]
    item_data["blog"] = item_data["client_blog"] = data["client_blog"]
    item_data["item_type"] = "comment"
    items = get_resource_service("client_items")
    item_id = items.post([item_data])[0]

    comment_data = dict()
    comment_data["post_status"] = "comment"
    comment_data["blog"] = comment_data["client_blog"] = item_data["blog"]
    comment_data["groups"] = [
        {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
        {"id": "main", "refs": [{"residRef": item_id}], "role": "grpRole:Main"},
    ]

    post_comments = get_resource_service("client_posts")
    post_comment = post_comments.post([comment_data])[0]

    comment = post_comments.find_one(req=None, _id=post_comment)

    resp = api_response(comment, 201)
    resp.headers["Access-Control-Allow-Credentials"] = "true"
    client_domain = data.get("__amp_source_origin")
    resp.headers["Access-Control-Allow-Origin"] = client_domain
    resp.headers["AMP-Access-Control-Allow-Source-Origin"] = client_domain
    resp.headers["Access-Control-Expose-Headers"] = (
        "AMP-Access-Control-Allow-Source-Origin"
    )
    return resp


@blog_posts_blueprint.route("/api/v2/client_blogs/<blog_id>/posts", methods=["GET"])
def get_blog_posts(blog_id):
    blog = Blog(blog_id)
    kwargs = {}

    # Get boolean arguments and cast string values to bool.
    try:
        kwargs["sticky"] = strtobool(request.args.get("sticky", "0"))
        kwargs["highlight"] = strtobool(request.args.get("highlight", "0"))
    except ValueError as e:
        return api_error(str(e), 403)

    # Get default ordering.
    ordering = request.args.get("ordering", Blog.default_ordering)
    if ordering not in Blog.ordering:
        return api_error('"{}" is not valid'.format(ordering), 403)
    kwargs["ordering"] = ordering

    # Get page & limit.
    try:
        kwargs["page"] = int(request.args.get("page", Blog.default_page))
        kwargs["limit"] = int(request.args.get("limit", Blog.default_page_limit))
    except ValueError as e:
        return api_error(str(e), 403)

    # Check page value.
    if kwargs["page"] < 1:
        return api_error('"page" value is not valid.', 403)

    # Check max page limit.
    if kwargs["limit"] > Blog.max_page_limit:
        return api_error('"limit" value is not valid.', 403)

    try:
        all_posts = strtobool(request.args.get("all_posts", "0"))
    except ValueError as e:
        return api_error(str(e), 403)

    if app.config.get("SUPERDESK_TESTING", False) and all_posts:
        kwargs["all_posts"] = True

    response_data = blog.posts(wrap=True, **kwargs)
    result_data = convert_posts(response_data, blog)
    return api_response(result_data, 200)


# convert posts - add items in post
def convert_posts(response_data, blog):
    fields = [
        "_id",
        "_etag",
        "_created",
        "_updated",
        "blog",
        "lb_highlight",
        "sticky",
        "deleted",
        "post_status",
        "published_date",
        "unpublished_date",
    ]

    for i, post in enumerate(response_data["_items"]):
        doc = {k: post.get(k) for k in fields}

        # add items in post
        doc["items"] = []
        for g in post.get("groups", []):
            if g["id"] != "main":
                continue

            for item in g["refs"]:
                doc["items"].append(_get_converted_item(item["item"]))

        # add authorship
        publisher = {}
        publisher["display_name"] = post["publisher"]["display_name"]
        publisher["picture_url"] = post["publisher"].get("picture_url", "")
        doc["publisher"] = publisher

        response_data["_items"][i] = doc

    # Add additional blog metadata to response _meta.
    response_data["_meta"]["last_updated_post"] = blog._blog.get("last_updated_post")
    response_data["_meta"]["last_created_post"] = blog._blog.get("last_created_post")
    return response_data


def _get_converted_item(item):
    converted = {}
    converted["_id"] = item["_id"]
    item_type = item["item_type"]
    converted["item_type"] = item_type
    converted["text"] = item["text"]

    if item_type == "embed":
        converted["meta"] = item["meta"]
    elif item_type == "quote":
        converted["meta"] = item["meta"]
    elif item_type == "image":
        meta = {}
        meta["caption"] = item["meta"]["caption"]
        meta["credit"] = item["meta"]["credit"]
        converted["meta"] = meta
        converted["renditions"] = item["meta"]["media"]["renditions"]
    elif item_type == "poll":
        converted["poll_body"] = poll_calculations(item["poll_body"])

    return converted
