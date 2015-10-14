import superdesk
from liveblog.blogs.blogs import BlogService, BlogsResource, UserBlogsResource, UserBlogsService
from liveblog.blogs.blog_membership import MembershipService, MembershipResource


def init_app(app):
    endpoint_name = 'blogs'
    service = BlogService(endpoint_name, backend=superdesk.get_backend())
    BlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'user_blogs'
    service = UserBlogsService(endpoint_name, backend=superdesk.get_backend())
    UserBlogsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blog_membership'
    service = MembershipService(endpoint_name, backend=superdesk.get_backend())
    MembershipResource(endpoint_name, app=app, service=service)


superdesk.privilege(name='blogs', label='Blog Management', description='User can manage blogs.')
