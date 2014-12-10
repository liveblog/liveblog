
import superdesk
from liveblog.blogs.blogs import BlogService, BlogsResource


def init_app(app):
    endpoint_name = 'blogs'
    service = BlogService(BlogsResource.datasource['source'],  backend=superdesk.get_backend())
    BlogsResource(endpoint_name, app=app, service=service)


superdesk.privilege(name='blogs', label='Blog Management', description='User can manage blogs.')
