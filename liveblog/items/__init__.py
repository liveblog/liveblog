import superdesk
from liveblog.items.items import ItemsService, ItemsResource,\
    PostItemsService, PostItemsResource, BlogItemsService, BlogItemsResource


def init_app(app):
    endpoint_name = 'items'

    service = ItemsService(endpoint_name, backend=superdesk.get_backend())
    ItemsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'post_items'
    service = PostItemsService(endpoint_name, backend=superdesk.get_backend())
    PostItemsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blog_items'
    service = BlogItemsService(endpoint_name, backend=superdesk.get_backend())
    BlogItemsResource(endpoint_name, app=app, service=service)
