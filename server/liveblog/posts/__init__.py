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


superdesk.privilege(name='posts', label='Can create a post', description='User can create a post from items')
superdesk.privilege(name='publish_post', label='Can publish a post',
                    description='User can publish a post to the timeline.')
superdesk.privilege(name='submit_post', label='Can submit a post for aproval',
                    description='User can submit a post for aproval.')
