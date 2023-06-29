import superdesk
from superdesk import get_backend


def init_app(app):
    # to avoid circular imports
    from liveblog.posts import posts

    endpoint_name = 'posts'
    service = posts.PostsService(endpoint_name, backend=superdesk.get_backend())
    posts.PostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'post_flags'
    service = posts.PostFlagService(endpoint_name, backend=superdesk.get_backend())
    posts.PostFlagResource(endpoint_name, app=app, service=service)

    endpoint_name = 'blog_posts'
    service = posts.BlogPostsService(endpoint_name, backend=superdesk.get_backend())
    posts.BlogPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = 'posts_versions'
    service = posts.PostsVersionsService(endpoint_name, backend=get_backend())
    posts.PostsVersionsResource(endpoint_name, app=app, service=service)


superdesk.privilege(name='posts', label='Can create a post', description='User can create a post from items')
superdesk.privilege(name='publish_post', label='Can publish a post',
                    description='User can publish a post to the timeline.')
superdesk.privilege(name='submit_post', label='Can submit a post for aproval',
                    description='User can submit a post for aproval.')
