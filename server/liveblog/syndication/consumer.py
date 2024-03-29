import logging

from bson import ObjectId
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.errors import SuperdeskApiError
from superdesk import get_resource_service
from flask import current_app as app
from flask import Blueprint
from flask_cors import CORS
from liveblog.utils.api import api_response

from .exceptions import APIConnectionError, ConsumerAPIError
from .syndication import WEBHOOK_METHODS
from .utils import (
    generate_api_key,
    send_api_request,
    trailing_slash,
    blueprint_superdesk_token_auth,
)
from .tasks import check_webhook_status

logger = logging.getLogger("superdesk")
consumers_blueprint = Blueprint("consumers", __name__)
CORS(consumers_blueprint)

consumers_schema = {
    "name": {"type": "string", "unique": True},
    "contacts": {
        "type": "list",
        "schema": {
            "type": "dict",
            "schema": {
                "first_name": {
                    "type": "string",
                },
                "last_name": {
                    "type": "string",
                },
                "email": {"type": "email", "required": True},
                "phone": {"type": "string", "nullable": True},
            },
        },
    },
    "api_key": {"type": "string", "unique": True},
    "webhook_url": {
        "type": "string",
        "required": True,
        "uniqueurl": True,
        "httpsurl": {"key_field": None, "check_auth": False, "webhook": True},
    },
    "webhook_enabled": {"type": "boolean", "default": False, "required": False},
    "picture_url": {"type": "string", "nullable": True},
    "avatar": Resource.rel("upload", embeddable=True, nullable=True),
    "avatar_renditions": {"type": "dict"},
}


class ConsumerService(BaseService):
    notification_key = "consumers"

    def _cursor(self, resource=None):
        resource = resource or self.datasource
        return app.data.mongo.pymongo(resource=resource).db[resource]

    def _get_consumer(self, consumer):
        if isinstance(consumer, (str, ObjectId)):
            consumer = self.find_one(_id=consumer, req=None)
        return consumer

    def _send_webhook_request(
        self,
        consumer_id,
        consumer_blog_token=None,
        method="GET",
        data=None,
        json_loads=True,
        timeout=5,
    ):
        consumer = self._get_consumer(consumer_id)
        if not consumer:
            raise ConsumerAPIError('Unable to get consumer "{}".'.format(consumer_id))

        api_url = trailing_slash(consumer["webhook_url"])
        localhost_addresses = ["localhost", "127.0.0.1"]

        is_webhook_enabled = consumer.get("webhook_enabled", False)
        is_localhost = any([host in api_url for host in localhost_addresses])

        if not is_webhook_enabled and not is_localhost:
            logger.warning(
                'Unable to send request. Consumer "{}" webhook is not available'.format(
                    api_url
                )
            )
            return

        try:
            response = send_api_request(
                api_url,
                consumer_blog_token,
                method=method,
                data=data,
                json_loads=json_loads,
                timeout=timeout,
            )
        except APIConnectionError as e:
            raise ConsumerAPIError(str(e))
        else:
            return response

    def is_allowed_by_tags(self, consumer_id, blog_id, post):
        """
        Checks if the consumer has the right tags so syndicated content can be sent
        """
        blog = get_resource_service("client_blogs").find_one(req=None, _id=blog_id)
        consumers_settings = blog.get("consumers_settings", {})
        settings = consumers_settings.get(str(consumer_id), {"tags": None})

        consumer_tags = settings.get("tags", None)

        # tags hasn't been set for this consumer
        # or the consumer has no tags selected, meaning tags allowed
        if consumer_tags is None or len(consumer_tags) == 0:
            return True

        post_tags = post.get("tags", [])
        return any([x in consumer_tags for x in post_tags])

    def send_post(self, syndication_out, new_post, action="created"):
        """Receives post information and sends it over webhook request to consumer
        It checks consumers tags with posts tags to make sure only filtered content is sent.
        If not tags are found for the consumer in blog settings it sends the post.
        """

        blog_token = syndication_out["token"]
        consumer_id = syndication_out["consumer_id"]

        try:
            post = new_post["post"]
            blog_id = post["blog"]

            if not self.is_allowed_by_tags(consumer_id, blog_id, post):
                return

        except KeyError as err:
            logger.error(
                'Error while getting blog id in `send_post`. Err: "{0}"'.format(err)
            )

        if action not in WEBHOOK_METHODS:
            raise NotImplementedError(
                'send_syndication_post "{}" not implemented yet.'.format(action)
            )
        else:
            return self._send_webhook_request(
                consumer_id, blog_token, method=WEBHOOK_METHODS[action], data=new_post
            )

    def on_create(self, docs):
        for doc in docs:
            if "webhook_url" in doc:
                doc["webhook_url"] = trailing_slash(doc["webhook_url"])
            if not doc.get("api_key"):
                doc["api_key"] = generate_api_key()

        super().on_create(docs)

    def on_created(self, docs):
        super().on_created(docs)

        for doc in docs:
            check_webhook_status.delay(doc["_id"])

    def on_update(self, updates, original):
        if "webhook_url" in updates:
            updates["webhook_url"] = trailing_slash(updates["webhook_url"])
        if "api_key" in updates and updates["api_key"] != original["api_key"]:
            updates["api_key"] = generate_api_key()

        super().on_update(updates, original)
        check_webhook_status.delay(original["_id"])

    def on_delete(self, doc):
        out_service = get_resource_service("syndication_out")
        if out_service.consumer_is_syndicating(doc["_id"]):
            raise SuperdeskApiError.forbiddenError(
                message="Not allowed to delete a consumer who is currently syndicating a blog"
            )
        super().on_delete(doc)


class ConsumerResource(Resource):
    datasource = {
        "source": "consumers",
        "search_backend": None,
        "default_sort": [("_updated", -1)],
    }

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {
        "POST": "consumers",
        "PATCH": "consumers",
        "PUT": "consumers",
        "DELETE": "consumers",
    }
    schema = consumers_schema


@consumers_blueprint.route(
    "/api/consumers/<consumer_id>/check_connection", methods=["GET"]
)
def consumer_check_connection(consumer_id):
    consumers = get_resource_service("consumers")
    consumer = consumers.find_one(_id=consumer_id, req=None)
    if not consumer:
        return api_response("invalid consumer id", 404)
    check_webhook_status(consumer_id)
    return api_response("OK", 200)


consumers_blueprint.before_request(blueprint_superdesk_token_auth)
