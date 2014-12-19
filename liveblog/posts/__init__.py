import superdesk
from liveblog.posts.posts import PostsService, PostsResource,\
    BlogPostService, BlogPostResource


def init_app(app):
    endpoint_name = 'posts'
    service = PostsService(endpoint_name, backend=superdesk.get_backend())
    PostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blog_posts'
    service = BlogPostService(endpoint_name, backend=superdesk.get_backend())
    BlogPostResource(endpoint_name, app=app, service=service)
