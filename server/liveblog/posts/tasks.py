import logging

from superdesk import get_resource_service
from superdesk.celery_app import celery
from liveblog.blogs.tasks import _publish_blog_embed_on_s3
from celery.exceptions import SoftTimeLimitExceeded
from settings import S3_CELERY_COUNTDOWN, S3_CELERY_MAX_RETRIES

logger = logging.getLogger('superdesk')


@celery.task()
def update_post_blog_data(post, action='created'):
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
    updates = {
        'total_posts': total_posts,
    }

    if action in ('updated', 'created'):
        # Update last_updated_post or last_created_post.
        post_field = 'last_{}_post'.format(action)
        updates[post_field] = {
            '_id': post['_id'],
            '_updated': post['_updated']
        }

    blogs.patch(blog_id, updates)
    logger.info('Blog "{}" post data has been updated.'.format(blog_id))


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
    if not theme:
        # Theme is not loaded yet.
        return

    if not theme.get('seoTheme'):
        logger.warning('Skipping embed update: blog "{}" theme "{}" is not SEO-enabled.'.format(blog_id, theme_name))
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
