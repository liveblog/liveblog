from flask_cors import CORS
from flask import Blueprint, current_app as app
from superdesk import get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService
from liveblog.utils.api import api_response
from .utils import send_bandwidth_alerts
from settings import BANDWIDTH_LIMIT_THRESHOLD

bandwidth_history_key = "bandwidth_history"
BANDWIDTH_HISTORY_SCHEMA = {
    "raw_response": {
        "type": "dict",
        "required": True,
    },
    "edge_response_bytes": {
        "type": "integer",
        "required": True,
        "min": 0,
    },
    "bandwidth_duration": {
        "type": "dict",
        "required": True,
        "schema": {
            "start_date": {
                "type": "datetime",
                "required": True,
            },
            "end_date": {
                "type": "datetime",
                "required": True,
            },
        },
    },
}
bandwidth_history_blueprint = Blueprint(bandwidth_history_key, __name__)
CORS(bandwidth_history_blueprint)


class BandwidthHistoryResource(Resource):
    """
    This resources is used to store bandwidth usage history for the liveblog instance.
    """

    datasource = {"source": bandwidth_history_key, "search_backend": None}
    schema = BANDWIDTH_HISTORY_SCHEMA.copy()
    item_methods = ["GET"]
    privileges = {"GET": "posts"}


class BandwidthHistoryService(BaseService):
    """
    Provides service methods for handling the creation and retrieval of bandwidth history data.
    """


@bandwidth_history_blueprint.route(
    "/api/bandwidth_history/recalculate", methods=["GET"]
)
def recalculate_bandwidth_history():
    """
    Recalculate the total bandwidth by summing all edge_response_bytes from bandwidth_history.

    Unlike the `/api/bandwidth/current` endpoint—which is triggered on every login so as to know
    whether to show the bandwidth limit warning on the dashboard - this recalculation endpoint
    actively aggregates usage from the full history and triggers bandwidth alerts
    if usage crosses the defined BANDWIDTH_LIMIT_THRESHOLD.

    This avoids repeated alerting on every login and ensures alerts are sent only
    when an explicit recalculation is performed.
    """
    response = {}
    if app.features.is_bandwidth_limit_enabled():
        upper_limit_gb = app.features.get_feature_limit("bandwidth_limit")
        bandwidth_history_service = get_resource_service("bandwidth_history")

        all_history = list(bandwidth_history_service.get_from_mongo(None, None))
        bandwidth_usage_bytes = sum(
            entry.get("edge_response_bytes", 0) for entry in all_history
        )
        bandwidth_usage_gb = bandwidth_usage_bytes / (1024**3)
        percentage_used = round((bandwidth_usage_gb / upper_limit_gb) * 100, 1)

        if percentage_used >= BANDWIDTH_LIMIT_THRESHOLD:
            # Send alerts if the usage exceeds bandwidth limit threshold
            send_bandwidth_alerts(upper_limit_gb, percentage_used)

        response["upperLimitGB"] = upper_limit_gb
        response["bandwidthUsageBytes"] = bandwidth_usage_bytes
        response["bandwidthUsageGB"] = bandwidth_usage_gb
        response["percentageUsed"] = percentage_used
        response["bandwidthLimit"] = True
    else:
        response["bandwidthLimit"] = False
        response["message"] = "Bandwidth Limit not enabled."

    return api_response(response, 200)
