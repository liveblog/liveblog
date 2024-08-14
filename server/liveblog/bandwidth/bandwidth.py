import logging

from bson import ObjectId
from flask_cors import CORS
from flask import Blueprint, render_template, current_app as app
from superdesk import get_resource_service
from superdesk.emails import send_email
from superdesk.resource import Resource
from superdesk.services import BaseService
from liveblog.utils.api import api_response


logger = logging.getLogger(__name__)
bandwidth_key = "bandwidth"
bandwidth_blueprint = Blueprint(bandwidth_key, __name__)
CORS(bandwidth_blueprint)

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
                dict(bandwidthUsage=updates["bandwidthUsage"]),
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
            self.send_email_if_bandwidth_exceeded(updated_bandwidth_usage)
        else:
            logger.info("No existing bandwidth record found to update.")

    def send_email_if_bandwidth_exceeded(self, current_bandwidth):
        """
        Send an email to the instance admin and support if the bandwidth usage exceeds the threshold
        """
        upper_limit_gb = app.features.get_feature_limit("bandwidth_limit")
        bandwidth_usage_gb = current_bandwidth / (1024**3)
        percentage_used = round((bandwidth_usage_gb / upper_limit_gb) * 100, 1)

        if percentage_used <= 75:
            return

        users = get_resource_service("users").get(
            req=None, lookup={"user_type": "administrator"}
        )
        recipients_email = [user["email"] for user in users] if users else []
        server_name = app.config["SERVER_NAME"]
        admins = app.config["ADMINS"]
        app_name = app.config["APPLICATION_NAME"]

        if recipients_email:
            subject = render_template(
                "bandwidth_alert_subject.txt",
                app_name=app_name,
                server_name=server_name,
            )
            text_body = render_template(
                "bandwidth_alert.txt",
                app_name=app_name,
                server_name=server_name,
                bandwidth_usage=percentage_used,
                allocated_bandwidth=upper_limit_gb,
            )
            html_body = render_template(
                "bandwidth_alert.html",
                app_name=app_name,
                server_name=server_name,
                bandwidth_usage=percentage_used,
                allocated_bandwidth=upper_limit_gb,
            )
            send_email.delay(
                subject=subject,
                sender=admins[0],
                recipients=recipients_email,
                text_body=text_body,
                html_body=html_body,
            )


@bandwidth_blueprint.route("/api/bandwidth/current", methods=["GET"])
def get_instance_bandwidth():
    """
    Returns the bandwidth for the instance
    """
    response = {}
    if app.features.is_bandwidth_limit_enabled():
        current_bandwidth = get_resource_service(bandwidth_key).get_current_bandwidth()

        if current_bandwidth:
            upper_limit_gb = app.features.get_feature_limit("bandwidth_limit")
            bandwidth_usage_bytes = current_bandwidth["bandwidthUsage"]
            bandwidth_usage_gb = bandwidth_usage_bytes / (1024**3)
            percentage_used = round((bandwidth_usage_gb / upper_limit_gb) * 100, 1)

            response["bandwidthUsageBytes"] = bandwidth_usage_bytes
            response["bandwidthUsageGB"] = bandwidth_usage_gb
            response["percentageUsed"] = percentage_used
            response["bandwidthLimit"] = True
        else:
            response["bandwidthLimit"] = False
    else:
        response["bandwidthLimit"] = False

    return api_response(response, 200)
