import superdesk
from liveblog.client_modules.client_modules import ClientBlogsResource, ClientBlogsService,\
    ClientPostsService, ClientPostsResource, ClientUsersResource, ClientUsersService, ClientBlogPostsService,\
    ClientBlogPostsResource, ClientCommentsService, ClientCommentsResource, ClientItemsService, ClientItemsResource,\
    ClientAdvertisementsResource, ClientAdvertisementsService, ClientCollectionsResource, ClientCollectionsService,\
    ClientOutputsResource, ClientOutputsService


def init_app(app):
    endpoint_name = 'client_blogs'
    service = ClientBlogsService(endpoint_name, backend=superdesk.get_backend())
    ClientBlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_posts'
    service = ClientPostsService(endpoint_name, backend=superdesk.get_backend())
    ClientPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_advertisement_collections'
    service = ClientCollectionsService(endpoint_name, backend=superdesk.get_backend())
    ClientCollectionsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_advertisement_outputs'
    service = ClientOutputsService(endpoint_name, backend=superdesk.get_backend())
    ClientOutputsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_advertisements'
    service = ClientAdvertisementsService(endpoint_name, backend=superdesk.get_backend())
    ClientAdvertisementsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_blog_posts'
    service = ClientBlogPostsService(endpoint_name, backend=superdesk.get_backend())
    ClientBlogPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_users'
    service = ClientUsersService(endpoint_name, backend=superdesk.get_backend())
    ClientUsersResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_comments'
    service = ClientCommentsService(endpoint_name, backend=superdesk.get_backend())
    ClientCommentsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'client_items'
    service = ClientItemsService(endpoint_name, backend=superdesk.get_backend())
    ClientItemsResource(endpoint_name, app=app, service=service)
