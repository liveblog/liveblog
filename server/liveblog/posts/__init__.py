import superdesk


def init_app(app):
    # import from here to avoid circular imports
    from liveblog.posts import posts, comments

    backend = superdesk.get_backend()

    endpoint_name = "posts"
    service = posts.PostsService(endpoint_name, backend)
    posts.PostsResource(endpoint_name, app=app, service=service)

    endpoint_name = "post_flags"
    service = posts.PostFlagService(endpoint_name, backend)
    posts.PostFlagResource(endpoint_name, app=app, service=service)

    endpoint_name = "blog_posts"
    service = posts.BlogPostsService(endpoint_name, backend)
    posts.BlogPostsResource(endpoint_name, app=app, service=service)

    endpoint_name = "posts_versions"
    service = posts.PostsVersionsService(endpoint_name, backend)
    posts.PostsVersionsResource(endpoint_name, app=app, service=service)

    endpoint_name = "post_comments"
    service = comments.PostCommentService(endpoint_name, backend)
    comments.PostCommentResource(endpoint_name, app=app, service=service)


superdesk.privilege(
    name="posts",
    label="Can create a post",
    description="User can create a post from items",
)

superdesk.privilege(
    name="publish_post",
    label="Can publish a post",
    description="User can publish a post to the timeline.",
)

superdesk.privilege(
    name="submit_post",
    label="Can submit a post for aproval",
    description="User can submit a post for aproval.",
)

superdesk.privilege(
    name="post_comments_create",
    label="Can add comments on posts",
    description="Can add comments on posts",
)

superdesk.privilege(
    name="post_comments_read",
    label="Can read commends on posts",
    description="Can read commends on posts",
)

superdesk.privilege(
    name="post_comments_update",
    label="Can update comments on posts",
    description="Can update comments on posts",
)

superdesk.privilege(
    name="post_comments_delete",
    label="Can delete comments on posts",
    description="Can delete comments on posts",
)
