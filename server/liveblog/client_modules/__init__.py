import superdesk
from liveblog.client_modules.client_modules import ClientBlogsResource, ClientBlogsService,\
    ClientPostsService, ClientPostsResource, ClientUsersResource, ClientUsersService, ClientBlogPostsService,\
    ClientBlogPostsResource


def init_app(app):
    endpoint_name = 'client_blogs'
    service = ClientBlogsService(endpoint_name, backend=superdesk.get_backend())
    ClientBlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_posts'
    service = ClientPostsService(endpoint_name, backend=superdesk.get_backend())
    ClientPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_blog_posts'
    service = ClientBlogPostsService(endpoint_name, backend=superdesk.get_backend())
    ClientBlogPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_users'
    service = ClientUsersService('users', backend=superdesk.get_backend())
    ClientUsersResource(endpoint_name, app=app, service=service)
