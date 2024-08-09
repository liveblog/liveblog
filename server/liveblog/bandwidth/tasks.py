import logging
import requests
from datetime import timedelta

from superdesk.celery_app import celery
from superdesk import get_resource_service
from superdesk.utc import utcnow
from settings import (
    CLOUDFLARE_URL,
    CLOUDFLARE_AUTH,
    CLOUDFLARE_ZONE_TAG,
    SUBSCRIPTION_LEVEL,
    SUBSCRIPTION_LEVEL_GO,
)

logger = logging.getLogger("liveblog")


@celery.task
def fetch_bandwidth_usage():
    """
    Fetch bandwidth usage from Cloudflare API
    """
    logger.info("Fetching bandwidth usage from Cloudflare API")

    if SUBSCRIPTION_LEVEL != SUBSCRIPTION_LEVEL_GO:
        return

    if not CLOUDFLARE_URL or not CLOUDFLARE_AUTH or not CLOUDFLARE_ZONE_TAG:
        logger.error("Missing needed credentials for Cloudflare API")
        return

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
            "zoneTag": CLOUDFLARE_ZONE_TAG,
            "filter": {
                "datetime_geq": start_date,
                "datetime_lt": end_date,
                "clientRequestHTTPHost_like": "%test%",  # TODO: Confirm if SERVER_NAME is the right one to use here
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

        logger.info("Fetching bandwidth usage from Cloudflare API successful.")

        bandwidth_service = get_resource_service("bandwidth")
        bandwidth_service.compute_new_bandwidth_usage(bandwidth_used)
    else:
        logger.error("Failed to retrieve data from Cloudflare API: %s", response.text)
