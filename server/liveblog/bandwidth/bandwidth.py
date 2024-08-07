import logging

from bson import ObjectId
from eve.utils import ParsedRequest
from superdesk.resource import Resource
from superdesk.services import BaseService


logger = logging.getLogger(__name__)
bandwidth_key = "bandwidth"
BANDWIDTH_SCHEMA = {
    "bandwidthUsage": {
        "type": "integer",
        "required": True,
        "min": 0,
    },
}


class BandwidthResource(Resource):
    """
    This resources is used to store bandwidth usage for the liveblog instance.
    """

    datasource = {"source": bandwidth_key, "search_backend": "elastic"}
    schema = BANDWIDTH_SCHEMA.copy()
    item_methods = ["GET", "PATCH"]
    privileges = {"GET": "posts", "PATCH": "posts"}


class BandwidthService(BaseService):
    """
    Provides service methods for handling the retrieval and update of bandwidth usage data.
    """

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        docs = super().get(req, lookup)
        return docs

    def get_current_bandwidth(self):
        """
        Check for bandwidth in the db. This assumes the singleton pattern
        """
        try:
            return self.get(req=None, lookup={})[0]
        except IndexError:
            return {}

    def update_bandwidth_usage(self, original, updates):
        """
        Update the bandwidth usage in the database.
        """
        try:
            self.patch(
                ObjectId(original.get("_id")),
                updates,
            )
        except Exception as err:
            logger.error("Unable to update bandwidth usage. {}".format(err))

    def compute_new_bandwidth_usage(self, bandwidth_usage):
        current_bandwidth = self.get_current_bandwidth()

        if current_bandwidth:
            existing_bandwidth_usage = current_bandwidth.get("bandwidthUsage", 0)
            updated_bandwidth_usage = existing_bandwidth_usage + bandwidth_usage
            updates = {"bandwidthUsage": updated_bandwidth_usage}
            self.update_bandwidth_usage(current_bandwidth, updates)
        else:
            logger.info("No existing bandwidth record found to update.")
