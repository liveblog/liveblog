import superdesk
from liveblog.bandwidth.bandwidth import (
    Bandwidth,
    bandwidth_key,
    BandwidthResource,
    BandwidthService,
)


def init_app(app):
    endpoint_name = bandwidth_key
    service = BandwidthService(endpoint_name, backend=superdesk.get_backend())
    BandwidthResource(endpoint_name, app=app, service=service)

    app.bandwidth = Bandwidth(app, service)
