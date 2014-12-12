import superdesk
from liveblog.items.items import ItemsService, ItemsResource,\
    ItemsPostService, ItemsPostResource


def init_app(app):
    endpoint_name = 'items'
    service = ItemsService(endpoint_name, backend=superdesk.get_backend())
    ItemsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'post_items'
    service = ItemsPostService(endpoint_name, backend=superdesk.get_backend())
    ItemsPostResource(endpoint_name, app=app, service=service)
