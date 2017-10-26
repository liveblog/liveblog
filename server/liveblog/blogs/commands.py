import superdesk
from superdesk import get_resource_service


class PublishBlogsCommand(superdesk.Command):
    """
    Republish blogs on s3 with the right theme
    """

    def run(self):
        from .tasks import publish_blog_embeds_on_s3

        # Retrieves all opened blogs.
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup=dict(blog_status='open'))
        outputs = blogs_service.get(req=None, lookup=dict(deleted=False))
        # Republish on s3.
        print('\n* Republishing blogs:\n')
        for blog in blogs:
            for output in outputs:
                if output['blog'] == blog['_id']:
                    url = publish_blog_embeds_on_s3(blog_id=str(blog['_id']), output=output, safe=False)
                    print('  - Blog "%s" output "%s" republished: %s' % (blog['title'], output['name'], url))
            url = publish_blog_embeds_on_s3(blog_id=str(blog['_id']), safe=False)
            print('  - Blog "%s" republished: %s' % (blog['title'], url))


class PublishBloglistCommand(superdesk.Command):
    def run(self):
        blogslist_service = get_resource_service('blogslist')
        blogslist_service.publish()
        print("Bloglist published to s3")
