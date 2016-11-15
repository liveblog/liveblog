import superdesk
from .blogslist import BlogsListService, BlogsListResource
from .blogslist import bp as embed_blogslist_blueprint
from .blogslist import bloglist_assets_blueprint


def init_app(app):
    endpoint_name = 'blogslist'
    service = BlogsListService(endpoint_name, backend=superdesk.get_backend())
    BlogsListResource(endpoint_name, app=app, service=service)
    # endpoint for bloglist a theme
    app.register_blueprint(embed_blogslist_blueprint)
    # endpoint to serve static files for bloglist
    app.register_blueprint(bloglist_assets_blueprint)


__all__ = ['embed_blogslist_blueprint']
