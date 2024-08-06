import logging
import requests
from datetime import timedelta

from bson import ObjectId
from eve.utils import ParsedRequest
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk.utc import utcnow
from settings import CLOUDFLARE_URL, CLOUDFLARE_AUTH


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
                dict(bandwidthUsage=updates.get("bandwidthUsage")),
            )
        except Exception as err:
            logger.error("Unable to update bandwidth usage. {}".format(err))


class Bandwidth:
    def __init__(self, app, db_service):
        self.app = app
        self.db_service = db_service

        if CLOUDFLARE_URL and CLOUDFLARE_AUTH:
            self._fetch_bandwidth_usage()

    def _fetch_bandwidth_usage(self):
        """
        Fetch bandwidth usage from Cloudflare API
        """
        url = f"{CLOUDFLARE_URL}"
        headers = {
            "Accept": "application/json",
            "Authorization": f"{CLOUDFLARE_AUTH}",
            "Content-Type": "application/json",
        }

        # Calculate the date range for the previous day
        today = utcnow()
        yesterday = today - timedelta(days=1)
        start_date = yesterday.strftime("%Y-%m-%dT00:00:00Z")
        end_date = today.strftime("%Y-%m-%dT00:00:00Z")

        data = {
            "query": """
            query RequestsAndDataTransferByHostname($zoneTag: String, $filter: Filter) {
                viewer {
                    zones(filter: {zoneTag: $zoneTag}) {
                        httpRequestsAdaptiveGroups(limit: 10, filter: $filter) {
                            sum {
                                edgeResponseBytes
                            }
                        }
                    }
                }
            }
            """,
            "variables": {
                "zoneTag": "2affe3d1ff646652435d68aa3db40dd8",
                "filter": {
                    "datetime_geq": start_date,
                    "datetime_lt": end_date,
                    "clientRequestHTTPHost_like": "%pnp%",
                    "requestSource": "eyeball",
                },
            },
        }

        response = requests.post(url, headers=headers, json=data)

        if response.status_code == 200:
            json_response = response.json()
            if "errors" in json_response and json_response["errors"]:
                logger.error("Errors from Cloudflare API: %s", json_response["errors"])
                return

            bandwidth_used = json_response["data"]["viewer"]["zones"][0][
                "httpRequestsAdaptiveGroups"
            ][0]["sum"]["edgeResponseBytes"]
            self._compute_new_bandwidth(bandwidth_used)
        else:
            logger.error(
                "Failed to retrieve data from Cloudflare API: %s", response.text
            )

    def _compute_new_bandwidth(self, latest_bandwidth_usage):
        """
        Compute the new bandwidth and update the db
        """
        with self.app.app_context():
            result = self.db_service.get_current_bandwidth()

            if result:
                existing_bandwidth_usage = result.get("bandwidthUsage", 0)
                updated_bandwidth_usage = (
                    existing_bandwidth_usage + latest_bandwidth_usage
                )
                updates = {"bandwidthUsage": updated_bandwidth_usage}
                self.db_service.update_bandwidth_usage(result, updates)
            else:
                logger.info("No existing bandwidth record found to update.")
