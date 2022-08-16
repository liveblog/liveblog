import logging
from celery import chain

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
    """
    Sends latest blog post updates to consumers webhook.

    When a consumer attaches to an existing blog, the producer sends a batch of posts that
    should be created sequentially (in the consumer) to preserve the order of the posts.
    To achieve this, we use a celery `chain` of subtasks. Subtasks in the chain must not
    raise any exception in order to continue the subsequent task and the next post is sent.
    """
    from .utils import extract_post_items_data, extract_producer_post_data

    posts_service = get_resource_service('posts')

    blog_id = syndication_out['blog_id']
    lookup = {'blog': blog_id, ITEM_TYPE: CONTENT_TYPE.COMPOSITE, 'deleted': False, 'post_status': 'open'}

    posts = posts_service.find(lookup)
    posts = posts.sort('order', -1)  # order to latest first

    array = []
    for element in posts:
        array.append(element)

        if len(array) >= limit:
            break

    subtasks = []
    array.reverse()
    for producer_post in array:
        is_repeated_syndication = 'repeat_syndication' in producer_post.keys()
        if is_repeated_syndication:
            continue

        items = extract_post_items_data(producer_post)
        post = extract_producer_post_data(producer_post)

        # Force post_status for old posts
        post['post_status'] = post_status

        post_data = {
            'items': items,
            'post': post
        }
        subtask_args = [syndication_out, post_data, action]

        # Because we are running the subtask in a chained mode, we need to provide
        # the initial param or result of other tasks as None. Read more here:
        # https://docs.celeryq.dev/en/stable/userguide/canvas.html#chains
        # This is required as we need to keep the order of the posts
        if len(subtasks) == 0:
            subtask_args.insert(0, None)

        send_internal = send_single_post_subtask.subtask(args=subtask_args)
        subtasks.append(send_internal)

    job = chain(subtasks)
    job.apply_async()


@celery.task(bind=True)
def send_single_post_subtask(self, chained_result, syndication_out, post_data, action):
    try:
        consumers = get_resource_service('consumers')
        consumers.send_post(syndication_out, post_data, action)
    except Exception as err:
        # once retry limit is reached, let's return instead of raising an exception
        # so the next subtask (post) will be also sent
        task_retries = SYNDICATION_CELERY_MAX_RETRIES + 1
        if task_retries == self.request.retries:
            post_id = post_data['post']['_id']
            consumer_id = syndication_out['consumer_id']
            consumer_blog_id = syndication_out['consumer_blog_id']

            logger.error(
                "Unable to send post '%s' to consumer '%s' and blog '%s'. Exception %s",
                post_id, consumer_id, consumer_blog_id, err)
            return

        raise self.retry(exc=err, max_retries=task_retries, countdown=SYNDICATION_CELERY_COUNTDOWN)


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
