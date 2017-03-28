import logging

from celery.exceptions import SoftTimeLimitExceeded
from flask import current_app as app
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.notification import push_notification

import liveblog.embed
from settings import S3_CELERY_COUNTDOWN, S3_CELERY_MAX_RETRIES

logger = logging.getLogger('superdesk')


def _publish_blog_embed_on_s3(blog_id, safe=True):
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if blog['blog_preferences'].get('theme', False):
        try:
            public_url = liveblog.embed.publish_embed(blog_id, '//%s/' % (app.config['SERVER_NAME']))
            get_resource_service('blogs').system_update(blog['_id'], {'public_url': public_url}, blog)
            push_notification('blog', published=1, blog_id=str(blog.get('_id')), public_url=public_url)
            return public_url
        except liveblog.embed.MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e

            public_url = '{}://{}/embed/{}'.format(app.config['URL_PROTOCOL'], app.config['SERVER_NAME'],
                                                   blog.get('_id'))
            get_resource_service('blogs').system_update(blog['_id'], {'public_url': public_url}, blog)
            push_notification('blog', published=1, blog_id=str(blog.get('_id')), public_url=public_url)
            return public_url


@celery.task(bind=True, soft_time_limit=1800)
def publish_blog_embed_on_s3(self, blog_id, safe=True):
    logger.warning('publish_blog_on_s3 for blog "{}" started.'.format(blog_id))
    try:
        _publish_blog_embed_on_s3(blog_id, safe)
    except (Exception, SoftTimeLimitExceeded) as e:
        logger.exception('publish_blog_on_s3 for blog "{}" failed.'.format(blog_id))
        raise self.retry(exc=e, max_retries=S3_CELERY_MAX_RETRIES, countdown=S3_CELERY_COUNTDOWN)
    finally:
        logger.warning('publish_blog_on_s3 for blog "{}" finished.'.format(blog_id))


@celery.task(bind=True, soft_time_limit=1800)
def delete_blog_embed_on_s3(self, blog_id, safe=True):
    logger.warning('delete_blog_on_s3 for blog "{}" started.'.format(blog_id))
    try:
        liveblog.embed.delete_embed(blog_id)
    except liveblog.embed.MediaStorageUnsupportedForBlogPublishing as e:
        if not safe:
            raise e
    except (Exception, SoftTimeLimitExceeded) as e:
        logger.exception('delete_blog_on_s3 for blog "{}" failed.'.format(blog_id))
        raise self.retry(exc=e, max_retries=S3_CELERY_MAX_RETRIES, countdown=S3_CELERY_COUNTDOWN)
    finally:
        logger.warning('delete_blog_on_s3 for blog "{}" finished.'.format(blog_id))
