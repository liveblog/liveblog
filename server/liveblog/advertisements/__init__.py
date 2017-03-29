import superdesk
from liveblog.advertisements.advertisements import AdvertisementsResource, AdvertisementsService
from liveblog.advertisements.collections import CollectionsResource, CollectionsService
from liveblog.advertisements.outputs import OutputsResource, OutputsService

def init_app(app):
    endpoint_name = 'advertisements'
    service = AdvertisementsService(endpoint_name, backend=superdesk.get_backend())
    AdvertisementsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'collections'
    service = CollectionsService(endpoint_name, backend=superdesk.get_backend())
    CollectionsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'outputs'
    service = OutputsService(endpoint_name, backend=superdesk.get_backend())
    OutputsResource(endpoint_name, app=app, service=service)
