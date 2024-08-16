import logging
import requests
from datetime import timedelta

from flask import current_app as app
from superdesk.celery_app import celery
from superdesk import get_resource_service
from superdesk.utc import utcnow
from settings import CLOUDFLARE_URL, CLOUDFLARE_AUTH, CLOUDFLARE_ZONE_TAG, SERVER_NAME

logger = logging.getLogger("liveblog")


@celery.task
def fetch_bandwidth_usage():
    """
    Fetch bandwidth usage from Cloudflare API
    """
    logger.info("Fetching bandwidth usage from Cloudflare API")

    if not app.features.is_bandwidth_limit_enabled():
        return

    if not CLOUDFLARE_URL or not CLOUDFLARE_AUTH or not CLOUDFLARE_ZONE_TAG:
        logger.error("Missing needed credentials for Cloudflare API")
        return

    subdomain = SERVER_NAME.split(".")[0] if SERVER_NAME else None

    if not subdomain:
        logger.error("Missing subdomain for Cloudflare API request")
        return

    url = f"{CLOUDFLARE_URL}"
    headers = {
        "Accept": "application/json",
        "Authorization": f"{CLOUDFLARE_AUTH}",
        "Content-Type": "application/json",
    }

    # Calculate the date range for the last 1 hour
    end_date = utcnow()
    start_date = end_date - timedelta(hours=1)
    start_date_str = start_date.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_date_str = end_date.strftime("%Y-%m-%dT%H:%M:%SZ")

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
                "datetime_geq": start_date_str,
                "datetime_lt": end_date_str,
                "clientRequestHTTPHost_like": f"%{subdomain}%",
                "requestSource": "eyeball",
            },
        },
    }

    response = requests.post(url, headers=headers, json=data)

    if response.status_code != 200:
        logger.error("Failed to retrieve data from Cloudflare API: %s", response.text)
        return

    json_response = response.json()

    if "errors" in json_response and json_response["errors"]:
        logger.error("Errors from Cloudflare API: %s", json_response["errors"])
        return

    zones = json_response["data"]["viewer"].get("zones")
    if not zones or len(zones) == 0:
        logger.error("No zones data available in the response.")
        return

    http_requests_groups = zones[0].get("httpRequestsAdaptiveGroups")
    if not http_requests_groups or len(http_requests_groups) == 0:
        logger.error("No httpRequestsAdaptiveGroups data available in the response.")
        return

    sum_data = http_requests_groups[0].get("sum")
    if not sum_data or "edgeResponseBytes" not in sum_data:
        logger.info("No edgeResponseBytes data available in the response.")
        return

    bandwidth_used = sum_data["edgeResponseBytes"]
    logger.info("Fetching bandwidth usage from Cloudflare API successful.")

    bandwidth_service = get_resource_service("bandwidth")
    bandwidth_service.compute_new_bandwidth_usage(bandwidth_used)
