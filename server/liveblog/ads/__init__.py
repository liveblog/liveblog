import superdesk
from liveblog.ads.ads import AdsResource, AdsService


def init_app(app):
    endpoint_name = 'ads'
    service = AdsService(endpoint_name, backend=superdesk.get_backend())
    AdsResource(endpoint_name, app=app, service=service)