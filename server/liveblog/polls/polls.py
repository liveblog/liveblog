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
        "source": "polls",
        "elastic_filter": {"term": {"particular_type": "poll"}},
        "default_sort": [("_updated", -1)],
    }
    schema = {
        "blog": Resource.rel("blogs", True),
        "particular_type": {"type": "string", "allowed": ["poll"], "default": "poll"},
        "item_type": {"type": "string", "default": "poll"},
        "text": {"type": "string", "default": "Poll placeholder"},
        "type": {"type": "string", "default": "poll"},
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


def poll_calculations(poll):
    """
    Calculate and adjust the percentage of votes for each answer in a poll to
    ensure they sum up to 100%
    """
    total_votes = sum(answer["votes"] for answer in poll["answers"])

    updated_answers = [
        {
            **answer,
            "percentage": (
                0 if total_votes == 0 else round((answer["votes"] / total_votes) * 100)
            ),
        }
        for answer in poll["answers"]
    ]

    if total_votes > 0:
        # Percentage Rounding Error Allocation method
        raw_percentages = [
            {
                **answer,
                "raw_percentage": (
                    0 if total_votes == 0 else (answer["votes"] / total_votes) * 100
                ),
            }
            for answer in poll["answers"]
        ]
        rounded_percentages = [
            {**answer, "percentage": round(answer["raw_percentage"])}
            for answer in raw_percentages
        ]
        total_percentage = sum(answer["percentage"] for answer in rounded_percentages)
        adjustment = 100 - total_percentage
        sorted_by_remainder = sorted(
            rounded_percentages,
            key=lambda answer: answer["raw_percentage"] - int(answer["raw_percentage"]),
            reverse=True,
        )

        for i in range(abs(adjustment)):
            sorted_by_remainder[i % len(sorted_by_remainder)]["percentage"] += int(
                adjustment / abs(adjustment)
            )

        updated_answers = [
            {
                "option": answer["option"],
                "votes": answer["votes"],
                "percentage": answer["percentage"],
            }
            for answer in sorted_by_remainder
        ]

    updated_answers.sort(key=lambda answer: answer["votes"], reverse=True)
    return {**poll, "answers": updated_answers}
