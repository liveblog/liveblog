import superdesk
from liveblog.blogs.blogs import BlogService, BlogsResource, UserBlogsResource, UserBlogsService
from liveblog.blogs.request_membership import MembershipService, MembershipResource
from liveblog.blogs.request_membership import MemberListService, MemberListResource


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


superdesk.privilege(name='blogs', label='Blog Management', description='User can manage blogs')
superdesk.privilege(name='request_membership', label='Can create a request', description='User can create a request')
