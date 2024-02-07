from eve.utils import ParsedRequest
from superdesk.notification import push_notification
from superdesk.resource import Resource
from superdesk.utc import utcnow
from superdesk.metadata.item import metadata_schema

from liveblog.common import get_user, update_dates_for

from superdesk.resource import Resource
from superdesk.services import BaseService


class PollsResource(Resource):
    """
    Defines the resource schema for Polls, including its data source, schema,
    allowed item methods, and privileges. This resource represents polls
    within the system, providing the necessary configuration for CRUD operations
    """

    datasource = {
        "source": "polls_collection",
        "elastic_filter": {"term": {"particular_type": "poll"}},
        "default_sort": [("_updated", -1)],
    }
    schema = {
        "blog": Resource.rel("blogs", True),
        "particular_type": {"type": "string", "allowed": ["poll"], "default": "poll"},
        "item_type": {"type": "string", "default": "poll"},
        "text": {"type": "string", "default": "Poll placeholder"},
        "group_type": {
            "type": "string",
            "allowed": ["freetype", "default"],
            "default": "default",
        },
        "poll_body": {
            "type": "dict",
            "schema": {
                "question": {"type": "string"},
                "answers": {
                    "type": "list",
                    "schema": {
                        "type": "dict",
                        "schema": {
                            "option": {"type": "string"},
                            "votes": {"type": "integer", "default": 0},
                        },
                    },
                },
                "active_until": {"type": "datetime"},
            },
        },
        "meta": {
            "type": "dict",
            "mapping": {"type": "object", "enabled": False},
            "default": {},
        },
        "original_creator": metadata_schema["original_creator"],
    }
    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    privileges = {"GET": "posts", "POST": "posts", "PATCH": "posts", "DELETE": "posts"}


class PollsService(BaseService):
    """
    Provides service methods for handling the lifecycle events of polls
    including CRUD operations. It extends from the Superdesk BaseService
    to include custom logic for polls, such as setting dates, sending notifications
    regarding changes, and managing versioning.
    """

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            update_dates_for(doc)
            doc["original_creator"] = str(get_user().get("_id"))
        return doc

    def on_created(self, docs):
        super().on_created(docs)
        push_notification("polls", created=1)

    def on_update(self, updates, original):
        super().on_update(updates, original)
        user = get_user()
        updates["versioncreated"] = utcnow()
        updates["version_creator"] = str(user.get("_id"))

    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        push_notification("polls", updated=1)

    def on_deleted(self, doc):
        super().on_deleted(doc)
        push_notification("polls", deleted=1)
