import logging
from werkzeug.datastructures import FileStorage
from superdesk.celery_app import celery
from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE
from .exceptions import APIConnectionError, DownloadError
from settings import SYNDICATION_CELERY_MAX_RETRIES, SYNDICATION_CELERY_COUNTDOWN


logger = logging.getLogger('superdesk')


@celery.task(bind=True)
def send_post_to_consumer(self, syndication_out, producer_post, action='created'):
    """Send blog post updates to consumers webhook."""
    from .utils import extract_post_items_data, extract_producer_post_data
    consumers = get_resource_service('consumers')
    items = extract_post_items_data(producer_post)
    post = extract_producer_post_data(producer_post)
    try:
        consumers.send_post(syndication_out, {
            'items': items,
            'post': post
        }, action)
    except APIConnectionError as e:
        raise self.retry(exc=e, max_retries=SYNDICATION_CELERY_MAX_RETRIES, countdown=SYNDICATION_CELERY_COUNTDOWN)


@celery.task(bind=True)
def send_posts_to_consumer(self, syndication_out, action='created', limit=25, post_status='submitted'):
    """Send latest blog post updates to consumers webhook."""
    from .utils import extract_post_items_data, extract_producer_post_data
    consumers = get_resource_service('consumers')
    blog_id = syndication_out['blog_id']
    posts_service = get_resource_service('posts')
    posts = posts_service.find({'blog': blog_id, ITEM_TYPE: CONTENT_TYPE.COMPOSITE}).limit(limit)
    try:
        for producer_post in posts:
            items = extract_post_items_data(producer_post)
            post = extract_producer_post_data(producer_post)
            # Force post_status for old posts
            post['post_status'] = post_status
            consumers.send_post(syndication_out, {
                'items': items,
                'post': post
            }, action)
    except APIConnectionError as e:
        raise self.retry(exc=e, max_retries=SYNDICATION_CELERY_MAX_RETRIES, countdown=SYNDICATION_CELERY_COUNTDOWN)


@celery.task(bind=True)
def fetch_image(self, url, mimetype):
    """Fetch image from given url."""
    from .utils import fetch_url
    try:
        return FileStorage(stream=fetch_url(url), content_type=mimetype)
    except DownloadError as e:
        raise self.retry(exc=e, max_retries=SYNDICATION_CELERY_MAX_RETRIES, countdown=SYNDICATION_CELERY_COUNTDOWN)
