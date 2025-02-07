import superdesk
from liveblog.bandwidth.bandwidth import (
    bandwidth_key,
    BandwidthResource,
    BandwidthService,
)
from .tasks import fetch_bandwidth_usage

__all__ = [
    "fetch_bandwidth_usage",
]


def init_app(app):
    endpoint_name = bandwidth_key
    service = BandwidthService(endpoint_name, backend=superdesk.get_backend())
    BandwidthResource(endpoint_name, app=app, service=service)
