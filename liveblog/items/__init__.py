import superdesk
from liveblog.items.items import ItemsService, ItemsResource, BlogItemsService, BlogItemsResource


def init_app(app):
    endpoint_name = 'items'

    service = ItemsService(endpoint_name, backend=superdesk.get_backend())
    ItemsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blog_items'
    service = BlogItemsService(endpoint_name, backend=superdesk.get_backend())
    BlogItemsResource(endpoint_name, app=app, service=service)
