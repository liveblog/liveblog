import logging

from bson import ObjectId
from flask.views import MethodView
from flask import current_app as app
from flask import Blueprint, abort, request
from flask_cors import CORS
from superdesk import get_resource_service
from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.services import BaseService
from liveblog.utils.api import api_error, api_response

from .auth import ConsumerBlogTokenAuth
from .tasks import (
    send_post_to_consumer,
    send_posts_to_consumer,
    unlink_syndicated_posts,
)
from .utils import (
    cast_to_object_id,
    create_syndicated_blog_post,
    generate_api_key,
    get_producer_post_id,
    extract_post_items_data,
)

logger = logging.getLogger("superdesk")
syndication_blueprint = Blueprint("syndication", __name__)
CORS(syndication_blueprint)


WEBHOOK_METHODS = {"created": "POST", "updated": "PUT", "deleted": "DELETE"}

syndication_out_schema = {
    "blog_id": Resource.rel("blogs", embeddable=True, required=True, type="objectid"),
    "consumer_id": Resource.rel(
        "consumers", embeddable=True, required=True, type="objectid"
    ),
    "consumer_blog_id": {"type": "objectid", "required": True},
    "token": {"type": "string", "unique": True},
    "auto_retrieve": {"type": "boolean", "default": True},
    "start_date": {"type": "datetime", "default": None},
}


class SyndicationOutService(BaseService):
    notification_key = "syndication_out"

    def _cursor(self, resource=None):
        resource = resource or self.datasource
        return app.data.mongo.pymongo(resource=resource).db[resource]

    def _get_blog(self, blog_id):
        return self._cursor("blogs").find_one({"_id": ObjectId(blog_id)})

    def _lookup(self, consumer_id, producer_blog_id, consumer_blog_id):
        lookup = {
            "$and": [
                {"consumer_id": consumer_id},
                {"blog_id": producer_blog_id},
                {"consumer_blog_id": consumer_blog_id},
            ]
        }
        return lookup

    def get_syndication(self, consumer_id, producer_blog_id, consumer_blog_id):
        try:
            return self.find(
                self._lookup(consumer_id, producer_blog_id, consumer_blog_id)
            )[0]
        except IndexError:
            return

    def consumer_is_syndicating(self, consumer_id):
        try:
            result = self.find({"$and": [{"consumer_id": consumer_id}]})
            return result.count() > 0
        except IndexError:
            return

    def get_blog_syndication(self, blog_id):
        blog = self._get_blog(blog_id)
        if not blog.get("syndication_enabled"):
            logger.info('Syndication not enabled for blog "{}"'.format(blog["_id"]))
            return []
        else:
            logger.info('Syndication enabled for blog "{}"'.format(blog["_id"]))
            return self.find({"blog_id": blog_id})

    def has_blog_syndication(self, blog):
        out_syndication = self.get_blog_syndication(blog)
        if not out_syndication:
            return False
        else:
            return bool(out_syndication.count())

    def _is_repeat_syndication(self, post):
        # Prevent "loops" by sending only posts with repeat_syndication to false
        if post.get("repeat_syndication"):
            logger.debug(
                'Not sending post "{}": syndicated content.'.format(post["_id"])
            )
            return False

        items = extract_post_items_data(post)
        for item in items:
            if (
                item["group_type"] == "freetype"
                and item["item_type"] in app.config["SYNDICATION_EXCLUDED_ITEMS"]
            ):
                logger.debug(
                    'Not sending post "{}": syndicated content contains excluded items.'.format(
                        post["_id"]
                    )
                )
                return False

        return True

    def send_syndication_post(self, post, action="created"):
        if self._is_repeat_syndication(post):
            blog_id = ObjectId(post["blog"])
            out_syndication = self.get_blog_syndication(blog_id)
            for out in out_syndication:
                send_post_to_consumer.delay(out, post, action)

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            if not doc.get("token"):
                doc["token"] = generate_api_key()
            cast_to_object_id(doc, ["consumer_id", "blog_id", "consumer_blog_id"])

    def on_created(self, docs):
        super().on_created(docs)
        for doc in docs:
            send_posts_to_consumer.delay(doc)

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        doc = original.copy()
        doc.update(updates)
        send_posts_to_consumer.delay(doc)

    def on_deleted(self, doc):
        super().on_deleted(doc)
        # send notifications
        push_notification(self.notification_key, syndication_out=doc, deleted=True)


class SyndicationOut(Resource):
    datasource = {
        "source": "syndication_out",
        "search_backend": None,
        "default_sort": [("_updated", -1)],
    }

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {
        "POST": "syndication_out",
        "PATCH": "syndication_out",
        "PUT": "syndication_out",
        "DELETE": "syndication_out",
    }
    schema = syndication_out_schema


syndication_in_schema = {
    "blog_id": Resource.rel("blogs", embeddable=True, required=True, type="objectid"),
    "blog_token": {"type": "string", "required": True, "unique": True},
    "producer_id": Resource.rel(
        "producers", embeddable=True, required=True, type="objectid"
    ),
    "producer_blog_id": {"type": "objectid", "required": True},
    "producer_blog_title": {"type": "string", "required": True},
    "auto_publish": {"type": "boolean", "default": False},
    "auto_retrieve": {"type": "boolean", "default": True},
    "start_date": {"type": "datetime", "default": None},
}


class SyndicationInService(BaseService):
    notification_key = "syndication_in"

    def _lookup(self, producer_id, producer_blog_id, consumer_blog_id):
        lookup = {
            "$and": [
                {"producer_id": producer_id},
                {"blog_id": consumer_blog_id},
                {"producer_blog_id": producer_blog_id},
            ]
        }
        return lookup

    def get_syndication(self, producer_id, producer_blog_id, consumer_blog_id):
        try:
            return self.find(
                self._lookup(producer_id, producer_blog_id, consumer_blog_id)
            )[0]
        except IndexError:
            return

    def is_syndicated(self, producer_id, producer_blog_id, consumer_blog_id):
        logger.warning("SyndicationInService.is_syndicated is deprecated!")
        item = self.get_syndication(producer_id, producer_blog_id, consumer_blog_id)
        return bool(item)

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            cast_to_object_id(
                doc, ["blog_id", "producer_id", "producer_blog_id", "consumer_blog_id"]
            )

    def on_delete(self, doc):
        super().on_delete(doc)
        unlink_syndicated_posts.delay(doc["_id"])
        push_notification(self.notification_key, syndication_in=doc, deleted=True)


class SyndicationIn(Resource):
    datasource = {
        "source": "syndication_in",
        "search_backend": None,
        "default_sort": [("_updated", -1)],
    }

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {
        "POST": "syndication_in_p",
        "PATCH": "syndication_in_p",
        "PUT": "syndication_in_p",
        "DELETE": "syndication_in_p",
    }
    schema = syndication_in_schema


class SyndicationWebhook(MethodView):
    """
    A Flask view handling syndication webhook requests for a blog.

    Supports GET, POST, PUT, and DELETE HTTP methods to manage blog posts
    in the context of syndication. This includes verifying blog syndication status,
    creating new posts, updating existing posts, and handling deleted posts.
    """

    def _initialize_services(self):
        self.blog_service = get_resource_service("client_blogs")
        self.posts_service = get_resource_service("posts")
        self.in_service = get_resource_service("syndication_in")

    def dispatch_request(self, *args, **kwargs):
        """
        Overrides the default dispatch to perform initial validation.

        Checks the blog token, verifies the syndication status and blog existence,
        and ensures the blog is open for updates. If any validation fails, an appropriate
        error response is returned. Otherwise, it proceeds with the request handling.

        Returns:
            Flask response object: An API response or error response.
        """
        # no blog_token but GET request, it means checking for webhook's response
        blog_token = request.headers.get("Authorization")
        if not blog_token and request.method == "GET":
            return api_response({}, 200)

        self._initialize_services()

        self.in_syndication = self.in_service.find_one(blog_token=blog_token, req=None)
        if not self.in_syndication:
            return api_error("Blog is not being syndicated", 406)

        self.blog = self.blog_service.find_one(
            req=None, _id=self.in_syndication["blog_id"]
        )
        if not self.blog:
            return api_error("Blog not found", 404)

        if self.blog.get("blog_status") != "open":
            return api_error(
                "Updates should not be sent for a blog which is not open", 409
            )

        # ensure necessary data is in the request
        self.request_data = data = request.get_json(silent=True) or {}
        if not all(key in data for key in ("items", "post")):
            return api_error("Bad Request", 400)

        return super(SyndicationWebhook, self).dispatch_request(*args, **kwargs)

    def _notify(self, post, **kwargs):
        notification_data = {"posts": [post]}
        notification_data.update(kwargs)
        push_notification("posts", **notification_data)

    def _get_producer_data(self):
        items, producer_post = self.request_data["items"], self.request_data["post"]
        producer_post_id = get_producer_post_id(
            self.in_syndication, producer_post["_id"]
        )
        post = self.posts_service.find_one(req=None, producer_post_id=producer_post_id)

        return items, producer_post, post

    def get(self):
        return api_response({}, 200)

    def post(self):
        items, producer_post, post = self._get_producer_data()

        if post:
            return api_error("Post already exist", 409)

        new_post = create_syndicated_blog_post(
            producer_post, items, self.in_syndication
        )
        new_post_id = self.posts_service.post([new_post])[0]

        self._notify(new_post, created=True)

        return api_response({"post_id": str(new_post_id)}, 201)

    def put(self):
        items, producer_post, post = self._get_producer_data()
        if not post:
            return api_error("Post does not exist", 404)

        post_id = post["_id"]
        update_post = create_syndicated_blog_post(
            producer_post, items, self.in_syndication
        )

        self.posts_service.patch(post_id, update_post)
        self._notify(update_post, updated=True)

        return api_response({"post_id": post["_id"]}, 200)

    def delete(self):
        post = self._get_producer_data()[2]
        if not post:
            return api_response("Post not found. Nothing to delete", 200)

        post_id = post["_id"]
        # self.posts_service.patch(post_id, {"deleted": True})
        self.posts_service.delete(lookup={"_id": post_id})
        self._notify(post, deleted=True, syndicated=True)

        return api_response({"post_id": post_id}, 200)


syndication_view = SyndicationWebhook.as_view("syndication_webhook")
syndication_blueprint.add_url_rule(
    "/api/syndication/webhook",
    view_func=syndication_view,
    methods=["GET", "POST", "PUT", "DELETE"],
)


def _syndication_blueprint_auth():
    auth = ConsumerBlogTokenAuth()
    # get requests do no require authorization
    authorized = request.method == "GET" or auth.authorized(
        allowed_roles=[], resource="syndication_blogs"
    )
    if not authorized:
        return abort(401, "Authorization failed.")


syndication_blueprint.before_request(_syndication_blueprint_auth)
