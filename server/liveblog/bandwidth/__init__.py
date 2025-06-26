import superdesk
from liveblog.bandwidth.bandwidth import (
    bandwidth_key,
    BandwidthResource,
    BandwidthService,
)
from liveblog.bandwidth.bandwidth_history import (
    bandwidth_history_key,
    BandwidthHistoryResource,
    BandwidthHistoryService,
)
from .tasks import fetch_bandwidth_usage

__all__ = [
    "fetch_bandwidth_usage",
]


def init_app(app):
    bandwidth_endpoint_name = bandwidth_key
    service = BandwidthService(bandwidth_endpoint_name, backend=superdesk.get_backend())
    BandwidthResource(bandwidth_endpoint_name, app=app, service=service)

    bandwidth_history_endpoint_name = bandwidth_history_key
    service = BandwidthHistoryService(
        bandwidth_history_endpoint_name, backend=superdesk.get_backend()
    )
    BandwidthHistoryResource(bandwidth_history_endpoint_name, app=app, service=service)
