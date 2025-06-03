from superdesk.resource import Resource
from superdesk.services import BaseService

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
