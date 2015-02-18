import superdesk
from liveblog.posts.posts import PostsService, PostsResource,\
    BlogPostsService, BlogPostsResource, PostsVersionsService, PostsVersionsResource
from superdesk import get_backend


def init_app(app):
    endpoint_name = 'posts'
    service = PostsService(endpoint_name, backend=superdesk.get_backend())
    PostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blog_posts'
    service = BlogPostsService(endpoint_name, backend=superdesk.get_backend())
    BlogPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'posts_versions'
    service = PostsVersionsService(endpoint_name, backend=get_backend())
    PostsVersionsResource(endpoint_name, app=app, service=service)
