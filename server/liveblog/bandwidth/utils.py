import logging

from flask import render_template, current_app as app
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError
from superdesk import get_resource_service
from superdesk.emails import send_email
from settings import LIVEBLOG_ZENDESK_EMAIL, SLACK_BOT_TOKEN, SLACK_ALERT_CHANNEL

logger = logging.getLogger(__name__)


def send_bandwidth_alerts(upper_limit_gb, percentage_used):
    send_email_alerts(upper_limit_gb, percentage_used)
    send_slack_alerts(upper_limit_gb, percentage_used)


def send_email_alerts(upper_limit_gb, percentage_used):
    """
    Sends an email alert to admins and support when bandwidth usage crosses a threshold.
    """
    logger.info("Sending bandwidth alert email to admins and support team")

    recipients_email = [LIVEBLOG_ZENDESK_EMAIL, "mwangikabiru21@gmail.com"]
    users = get_resource_service("users").get(
        req=None, lookup={"user_type": "administrator"}
    )
    if users:
        recipients_email.extend([user["email"] for user in users])

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

        try:
            send_email.delay(
                subject=subject,
                sender=admins[0],
                recipients=recipients_email,
                text_body=text_body,
                html_body=html_body,
            )
        except Exception as err:
            logger.error("Error occurred while sending bandwidth alert email: %s", err)


def send_slack_alerts(upper_limit_gb, percentage_used):
    logger.info("Sending bandwidth alert to Slack")

    token = SLACK_BOT_TOKEN
    channel = SLACK_ALERT_CHANNEL

    if not token and not channel:
        logger.warning("Slack configurations not set. Skipping Slack alert.")
        return

    client = WebClient(token=token)
    server_name = app.config["SERVER_NAME"]
    app_name = app.config["APPLICATION_NAME"]

    message = (
        f":warning: *{app_name} Bandwidth Alert* on `{server_name}`\n"
        f"> *Usage:* {percentage_used:.2f}% of the {upper_limit_gb} GB limit reached."
    )

    try:
        response = client.chat_postMessage(
            channel=channel,
            text=message,
        )
        logger.info("Slack alert sent: %s", response["ts"])
    except SlackApiError as e:
        logger.error("Slack API Error: %s", e.response["error"])
    except Exception as err:
        logger.error("Error occurred while sending Slack alert: %s", err)
