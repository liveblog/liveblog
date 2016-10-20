import superdesk
from .blogs_list import BlogsListService, BlogsListResource
from .blogs_list import bp as embed_blogs_list_blueprint
from .blogs_list import bloglist_assets_blueprint

def init_app(app):
    endpoint_name = 'blogs_list'
    service = BlogsListService(endpoint_name, backend=superdesk.get_backend())
    BlogsListResource(endpoint_name, app=app, service=service)
    # endpoint for bloglist a theme
    app.register_blueprint(embed_blogs_list_blueprint)
    # endpoint to serve static files for bloglist
    app.register_blueprint(bloglist_assets_blueprint)

__all__ = ['embed_blogs_list_blueprint']