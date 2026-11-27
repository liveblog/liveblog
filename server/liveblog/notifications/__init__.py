from liveblog.notifications.producer import BackgroundNotificationProducer
from superdesk.default_settings import celery_queue


def init_app(app):
    # Replaces the client set by `superdesk.notification`, which publishes inside the caller and
    # can block a request or task while the broker is down. Must stay after `superdesk.notification`
    # in INSTALLED_APPS. See LBSD-2994.
    previous = getattr(app, "notification_client", None)
    if previous is not None:
        previous.close()
    app.notification_client = BackgroundNotificationProducer(
        app.config["CELERY_BROKER_URL"],
        app.config.get("WEBSOCKET_EXCHANGE") or celery_queue("socket_notification"),
    )
