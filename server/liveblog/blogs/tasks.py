import io
import logging

import superdesk
from celery.exceptions import SoftTimeLimitExceeded
from flask import current_app as app
from settings import S3_CELERY_COUNTDOWN, S3_CELERY_MAX_RETRIES
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.notification import push_notification

from .embeds import embed
from .exceptions import MediaStorageUnsupportedForBlogPublishing
from .utils import check_media_storage, get_blog_path

logger = logging.getLogger('superdesk')


def publish_embed(blog_id, api_host=None, theme=None):
    # Get html using embed() blueprint
    html = embed(blog_id, api_host, theme)
    check_media_storage()
    file_path = get_blog_path(blog_id)
    # Remove existing file
    app.media.delete(app.media.media_id(file_path, version=False))
    logger.warning('Embed file "{}" for blog "{}" removed from s3'.format(file_path, blog_id))
    # Upload new file
    file_id = app.media.put(io.BytesIO(bytes(html, 'utf-8')), filename=file_path, content_type='text/html',
                            version=False)
    logger.warning('Embed file "{}" for blog "{}" uploaded to s3'.format(file_path, blog_id))
    return superdesk.upload.url_for_media(file_id)


def delete_embed(blog_id):
    check_media_storage()
    file_path = get_blog_path(blog_id)
    # Remove existing file
    app.media.delete(file_path)


def _publish_blog_embed_on_s3(blog_id, safe=True):
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if blog['blog_preferences'].get('theme', False):
        try:
            public_url = publish_embed(blog_id, '//%s/' % (app.config['SERVER_NAME']))
            get_resource_service('blogs').system_update(blog_id, {'public_url': public_url}, blog)
            push_notification('blog', published=1, blog_id=blog_id, public_url=public_url)
            return public_url
        except MediaStorageUnsupportedForBlogPublishing as e:
            if not safe:
                raise e

            logger.warning('Media storage not supported for blog "{}"'.format(blog_id))
            public_url = '{}://{}/embed/{}'.format(app.config['URL_PROTOCOL'], app.config['SERVER_NAME'], blog_id)
            get_resource_service('blogs').system_update(blog_id, {'public_url': public_url}, blog)
            push_notification('blog', published=1, blog_id=blog_id, public_url=public_url)
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
        delete_embed(blog_id)
    except MediaStorageUnsupportedForBlogPublishing as e:
        if not safe:
            raise e
    except (Exception, SoftTimeLimitExceeded) as e:
        logger.exception('delete_blog_on_s3 for blog "{}" failed.'.format(blog_id))
        raise self.retry(exc=e, max_retries=S3_CELERY_MAX_RETRIES, countdown=S3_CELERY_COUNTDOWN)
    finally:
        logger.warning('delete_blog_on_s3 for blog "{}" finished.'.format(blog_id))
