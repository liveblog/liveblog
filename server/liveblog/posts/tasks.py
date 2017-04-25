import logging

from superdesk import get_resource_service
from superdesk.celery_app import celery

logger = logging.getLogger('superdesk')


@celery.task()
def update_post_blog_data(post, updated=False):
    """
    Update blog data num_post and last created or updated post.

    :param post:
    :param updated:
    :return: None
    """
    blogs = get_resource_service('client_blogs')
    posts = get_resource_service('posts')
    blog_id = post['blog']

    # Fetch total posts.
    total_posts = posts.find({'$and': [
        {'blog': {'$eq': blog_id}},
        {'post_status': {'$eq': 'open'}},
        {'deleted': {'$eq': False}}
    ]}).count()

    date_field = 'created'
    if updated:
        date_field = 'updated'
    post_field = 'last_{}_post'.format(date_field)
    blogs.patch(blog_id, {
        'total_posts': total_posts,
        post_field: {
            '_id': post['_id'],
            '_updated': post['_updated']
        }
    })
    logger.info('Blog "{}" post data has been {}.'.format(blog_id, date_field))
