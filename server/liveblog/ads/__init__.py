import superdesk
from liveblog.ads.ads import AdsResource, AdsService
from liveblog.ads.collections import CollectionsResource, CollectionsService


def init_app(app):
    endpoint_name = 'ads'
    service = AdsService(endpoint_name, backend=superdesk.get_backend())
    AdsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'collections'
    service = CollectionsService(endpoint_name, backend=superdesk.get_backend())
    CollectionsResource(endpoint_name, app=app, service=service)
