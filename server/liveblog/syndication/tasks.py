import logging

from flask import current_app as app
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.metadata.item import CONTENT_TYPE, ITEM_TYPE
from superdesk.notification import push_notification

from .exceptions import APIConnectionError
from settings import SYNDICATION_CELERY_MAX_RETRIES, SYNDICATION_CELERY_COUNTDOWN
from .utils import send_api_request


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
def send_posts_to_consumer(self, syndication_out, action='created', limit=50, post_status='submitted'):
    """Send latest blog post updates to consumers webhook."""
    from .utils import extract_post_items_data, extract_producer_post_data
    consumers = get_resource_service('consumers')
    blog_id = syndication_out['blog_id']
    posts_service = get_resource_service('posts')
    lookup = {'blog': blog_id, ITEM_TYPE: CONTENT_TYPE.COMPOSITE, 'deleted': False, 'post_status': 'open'}

    posts = posts_service.find(lookup)

    # sort by order to get the latest first
    posts = posts.sort('order', -1)

    try:
        array = []
        for element in posts:
            array.append(element)
            if len(array) >= limit:
                break

        array.reverse()
        for producer_post in array:
            # Don't forward syndicated posts
            if 'syndication_in' in producer_post.keys():
                continue
            items = extract_post_items_data(producer_post)
            post = extract_producer_post_data(producer_post)
            # Force post_status for old posts
            post['post_status'] = post_status
            consumers.send_post(syndication_out, {
                'items': items,
                'post': post
            }, action)
    except APIConnectionError as e:
        logger.warning('Unable to send posts to consumer: {}'.format(e))
        raise self.retry(exc=e, max_retries=SYNDICATION_CELERY_MAX_RETRIES, countdown=SYNDICATION_CELERY_COUNTDOWN)


@celery.task(bind=True)
def check_webhook_status(self, consumer_id):
    """Check if consumer webhook is enabled by sending a fake http api request."""
    from .utils import send_api_request
    if app.config.get('SUPERDESK_TESTING'):
        return

    consumers = get_resource_service('consumers')
    consumer = consumers._get_consumer(consumer_id) or {}
    if 'webhook_url' in consumer:
        try:
            response = send_api_request(consumer['webhook_url'], None, method='GET', json_loads=False)
        except (Exception, APIConnectionError):
            logger.warning('Unable to connect to webhook_url "{}"'.format(consumer['webhook_url']))
            webhook_enabled = False
        else:
            if response.status_code == 200:
                logger.info('Connected to webhook_url "{}".'.format(consumer['webhook_url']))
                webhook_enabled = True
            else:
                logger.warning('Unable to connect to webhook_url "{}", status: {}'.format(consumer['webhook_url'],
                                                                                          response.status_code))
                webhook_enabled = False

        cursor = consumers._cursor()
        cursor.find_one_and_update({'_id': consumer['_id']}, {'$set': {'webhook_enabled': webhook_enabled}})
        push_notification(consumers.notification_key, consumer={
            '_id': consumer['_id'],
            'webhook_enabled': webhook_enabled
        }, updated=True)


@celery.task(bind=True)
def check_api_status(self, producer_or_id):
    producers = get_resource_service('producers')
    producer = producers._get_producer(producer_or_id) or {}
    if not producer:
        return

    if 'api_url' not in producer:
        api_status = 'invalid_url'
    elif 'consumer_api_key' not in producer:
        api_status = 'invalid_key'
    else:
        try:
            api_url = producers._get_api_url(producer, 'syndication/blogs')
            response = send_api_request(api_url, producer['consumer_api_key'], json_loads=False)
        except (Exception, APIConnectionError):
            api_status = 'invalid_url'
        else:
            if response.status_code != 200:
                api_status = 'invalid_key'
            else:
                api_status = 'enabled'

    cursor = producers._cursor()
    cursor.find_one_and_update({'_id': producer['_id']}, {'$set': {'api_status': api_status}})
    push_notification(producers.notification_key, producer={
        '_id': producer['_id'],
        'api_status': api_status
    }, updated=True)
