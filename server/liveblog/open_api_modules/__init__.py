import superdesk
from liveblog.open_api_modules.open_modules import OpenBlogsResource, OpenBlogsService,\
    OpenPostsService, OpenPostsResource, OpenUsersResource, OpenUsersService, OpenBlogPostsService,\
    OpenBlogPostsResource

def init_app(app):
    endpoint_name = 'client_blogs'
    service = OpenBlogsService(endpoint_name, backend=superdesk.get_backend())
    OpenBlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_posts'
    service = OpenPostsService(endpoint_name, backend=superdesk.get_backend())
    OpenPostsResource(endpoint_name, app=app, service=service)
    
    endpoint_name = 'client_blog_posts'
    service = OpenBlogPostsService(endpoint_name, backend=superdesk.get_backend())
    OpenBlogPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_users'
    service = OpenUsersService(endpoint_name, backend=superdesk.get_backend())
    OpenUsersResource(endpoint_name, app=app, service=service)

