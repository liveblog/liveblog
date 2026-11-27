from liveblog.notifications.producer import BackgroundNotificationProducer
from superdesk.default_settings import celery_queue


def init_app(app):
    # Replaces the client set by `superdesk.notification`, which publishes inside the caller and
    # can block a request or task while the broker is down. Must stay after `superdesk.notification`
    # in INSTALLED_APPS. See LBSD-2994.
    # Eve returns (and stores) an event slot, which has no `close`, for any attribute not set yet.
    close = getattr(getattr(app, "notification_client", None), "close", None)
    if close is not None:
        close()
    app.notification_client = BackgroundNotificationProducer(
        app.config["CELERY_BROKER_URL"],
        app.config.get("WEBSOCKET_EXCHANGE") or celery_queue("socket_notification"),
    )
