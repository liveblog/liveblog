import superdesk
from .blogs import BlogService, BlogsResource, UserBlogsResource, UserBlogsService
from .request_membership import MembershipService, MembershipResource, MemberListService, MemberListResource
from .tasks import publish_blog_embed_on_s3, delete_blog_embed_on_s3
from .commands import PublishBlogsCommand

__all__ = ['BlogService', 'BlogsResource', 'UserBlogsResource', 'UserBlogsService',
           'MembershipService', 'MembershipResource', 'MemberListService', 'MemberListResource',
           'publish_blog_embed_on_s3', 'delete_blog_embed_on_s3',
           'PublishBlogsCommand']


def init_app(app):
    endpoint_name = 'blogs'
    service = BlogService(endpoint_name, backend=superdesk.get_backend())
    BlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'user_blogs'
    service = UserBlogsService(endpoint_name, backend=superdesk.get_backend())
    UserBlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'request_membership'
    service = MembershipService(endpoint_name, backend=superdesk.get_backend())
    MembershipResource(endpoint_name, app=app, service=service)

    endpoint_name = 'user_requests'
    service = MemberListService(endpoint_name, backend=superdesk.get_backend())
    MemberListResource(endpoint_name, app=app, service=service)


superdesk.command('publish_blogs', PublishBlogsCommand())
superdesk.privilege(name='blogs', label='Blog Management', description='User can manage blogs')
superdesk.privilege(name='request_membership', label='Can create a request', description='User can create a request')
