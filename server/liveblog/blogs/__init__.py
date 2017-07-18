import superdesk
from .blogs import BlogService, BlogsResource, UserBlogsResource, UserBlogsService
from .blogslist import BlogsListService, BlogsListResource, bloglist_assets_blueprint, bloglist_blueprint
from .request_membership import MembershipService, MembershipResource, MemberListService, MemberListResource
from .tasks import publish_blog_embed_on_s3, delete_blog_embeds_on_s3
from .commands import PublishBlogsCommand, PublishBloglistCommand

__all__ = [
    'BlogService', 'BlogsResource', 'UserBlogsResource', 'UserBlogsService',
    'BlogsListService', 'BlogsListResource', 'bloglist_blueprint', 'bloglist_assets_blueprint',
    'MembershipService', 'MembershipResource', 'MemberListService', 'MemberListResource',
    'publish_blog_embed_on_s3', 'delete_blog_embeds_on_s3',
    'PublishBlogsCommand', 'PublishBloglistCommand',
]


def init_app(app):
    endpoint_name = 'blogs'
    service = BlogService(endpoint_name, backend=superdesk.get_backend())
    BlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blogslist'
    service = BlogsListService(endpoint_name, backend=superdesk.get_backend())
    BlogsListResource(endpoint_name, app=app, service=service)

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
superdesk.command('register_bloglist', PublishBloglistCommand())
superdesk.privilege(name='blogs', label='Blog Management', description='User can manage blogs')
superdesk.privilege(name='request_membership', label='Can create a request', description='User can create a request')
