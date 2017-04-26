import logging

from superdesk import get_resource_service
from superdesk.celery_app import celery
from liveblog.blogs.tasks import _publish_blog_embed_on_s3
from celery.exceptions import SoftTimeLimitExceeded
from settings import S3_CELERY_COUNTDOWN, S3_CELERY_MAX_RETRIES

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


@celery.task(bind=True)
def update_post_blog_embed(self, post):
    """
    Update post blog embed.

    :param post:
    :return:
    """
    blogs = get_resource_service('client_blogs')
    themes = get_resource_service('themes')
    blog_id = post['blog']
    blog = blogs.find_one(req=None, _id=blog_id)
    theme_name = blog['blog_preferences']['theme']

    # Check if theme is SEO-enabled.
    theme = themes.find_one(req=None, name=theme_name)
    if not theme.get('seoTheme'):
        logger.info('Skipping embed update: blog "{}" theme "{}" is not SEO-enabled.'.format(blog_id, theme_name))
        return

    # TODO: add locking or check last_updated_post_date or last_created_post_date.

    logger.warning('update_post_blog_embed for blog "{}" started.'.format(blog_id))
    try:
        _publish_blog_embed_on_s3(blog_id, safe=True)
    except (Exception, SoftTimeLimitExceeded) as e:
        logger.exception('update_post_blog_embed for blog "{}" failed.'.format(blog_id))
        raise self.retry(exc=e, max_retries=S3_CELERY_MAX_RETRIES, countdown=S3_CELERY_COUNTDOWN)
    finally:
        logger.warning('update_post_blog_embed for blog "{}" finished.'.format(blog_id))
