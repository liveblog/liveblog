import superdesk
from liveblog.marketplace.blogs import BlogService, BlogResource


def init_app(app):
    # Marketplace blogs
    endpoint_name = 'marketplace_blogs'
    service = BlogService(endpoint_name, backend=superdesk.get_backend())
    BlogResource(endpoint_name, app=app, service=service)
