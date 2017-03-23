import superdesk
from liveblog.advertisements.advertisements import AdvertisementsResource, AdvertisementsService
from liveblog.advertisements.collections import CollectionsResource, CollectionsService


def init_app(app):
    endpoint_name = 'advertisements'
    service = AdvertisementsService(endpoint_name, backend=superdesk.get_backend())
    AdvertisementsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'collections'
    service = CollectionsService(endpoint_name, backend=superdesk.get_backend())
    CollectionsResource(endpoint_name, app=app, service=service)
