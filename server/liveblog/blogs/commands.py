import superdesk
from superdesk import get_resource_service


class PublishBlogsCommand(superdesk.Command):
    """
    Republish blogs on s3 with the right theme
    """

    def run(self):
        from .tasks import publish_blog_embed_on_s3

        # Retrieves all opened blogs.
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup=dict(blog_status='open'))
        # Republish on s3.
        print('\n* Republishing blogs:\n')
        for blog in blogs:
            url = publish_blog_embed_on_s3(blog_id=str(blog['_id']), safe=False)
            print('  - Blog "%s" republished: %s' % (blog['title'], url))


class PublishBloglistCommand(superdesk.Command):
    def run(self):
        blogslist_service = get_resource_service('blogslist')
        blogslist_service.publish()
        print("Bloglist published to s3")
