import json
import uuid
import hmac
import logging
import requests
import tempfile
from bson import ObjectId
from hashlib import sha1
from flask import make_response
from eve.io.mongo import MongoJSONEncoder
from .exceptions import APIConnectionError, DownloadError
from requests.exceptions import RequestException
from requests.packages.urllib3.exceptions import MaxRetryError
from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE
from .tasks import fetch_image


logger = logging.getLogger('superdesk')


def generate_api_key():
    """Generate a new API Key."""
    random_uuid = uuid.uuid4()
    return hmac.new(random_uuid.bytes, digestmod=sha1).hexdigest()


def trailing_slash(url):
    """Add trailing slash to url."""
    if not url.endswith('/'):
        url = '{}/'.format(url)
    return url


def api_response(data, status_code, json_dumps=True):
    """Make json response for blueprints."""
    if json_dumps:
        data = json.dumps(data)
    response = make_response(data)
    response.status_code = status_code
    response.mimetype = 'application/json'
    return response


def api_error(error_message, status_code):
    """Make error for blueprints."""
    return api_response({
        '_status': 'ERR',
        '_error': error_message
    }, status_code)


def cast_to_object_id(doc, fields):
    """Cast provided document fields to ObjectId."""
    for field in fields:
        value = doc.get(field)
        if not value:
            continue

        if not ObjectId.is_valid(value):
            logger.warning('Field "{}" value "{}" is not a valid ObjectId')
            continue

        doc[field] = ObjectId(value)


def send_api_request(api_url, api_key, method='GET', args=None, data=None, json_loads=True, timeout=5):
    """Utility function to send http requests for consumer/producer api endpoints."""
    if data:
        data = json.dumps(data, cls=MongoJSONEncoder)

    logger.info('API {} request to {} with params={} and data={}'.format(method, api_url, args, data))
    try:
        response = requests.request(method, api_url, headers={
            'Authorization': api_key,
            'Content-Type': 'application/json'
        }, params=args, data=data, timeout=timeout)
    except (ConnectionError, RequestException, MaxRetryError):
        raise APIConnectionError('Unable to connect to api_url "{}".'.format(api_url))

    logger.warning('API {} request to {} - response: {} {}'.format(
        method, api_url, response.status_code, response.content
    ))

    if not json_loads:
        return response
    else:
        return response.json()


def fetch_url(url, timeout=5):
    """Fetch url using python-requests and save data to temporary file."""
    try:
        response = requests.get(url, timeout=timeout)
    except (ConnectionError, RequestException, MaxRetryError):
        raise DownloadError('Unable to download url: "{}"'.format(url))
    fd = tempfile.NamedTemporaryFile()
    for chunk in response.iter_content(chunk_size=1024):
        if chunk:
            fd.write(chunk)
    fd.seek(0)
    return fd


def extract_post_items_data(original_doc):
    """Extract blog post items."""
    items_service = get_resource_service('items')
    item_type = original_doc.get(ITEM_TYPE, '')
    if item_type != CONTENT_TYPE.COMPOSITE:
        raise NotImplementedError('Post item_type "{}" not supported.'.format(item_type))

    items = []
    for group in original_doc['groups']:
        if group['id'] == 'main':
            for ref in group['refs']:
                item = items_service.find_one(req=None, guid=ref['guid'])
                item_type = item['item_type']
                data = {
                    'text': item['text'],
                    'item_type': item_type,
                    'meta': item.get('meta', {})
                }
                items.append(data)
    return items


def _get_html_from_image_data(renditions, **meta):
    """Generate html code for new blog post image items."""
    srcset = []
    for value in renditions.values():
        srcset.append('{} {}w'.format(value['href'], value['width']))

    credit = meta.get('credit', '')
    caption = meta.get('caption', '')
    if credit:
        full_caption = '{} Credit: {}'.format(caption, credit)
    else:
        full_caption = caption

    return ''.join([
        '<figure>',
        '   <img src="{}" alt="{}" srcset="{}" />'.format(
            renditions['viewImage']['href'],
            full_caption,
            ','.join(srcset)
        ),
        '   <figcaption>{}</figcaption>'.format(full_caption),
        '</figure>'
    ])


def _fetch_and_create_image_item(renditions, **meta):
    """Download and create image item from producer blog post renditions"""
    try:
        image_url = renditions['original']['href']
        mimetype = renditions['original']['mimetype']
    except KeyError:
        raise DownloadError('Unable to get original image from renditions: {}'.format(renditions))

    item_data = dict()
    item_data['type'] = 'picture'
    item_data['media'] = fetch_image(image_url, mimetype)
    archive_service = get_resource_service('archive')
    item_id = archive_service.post([item_data])[0]
    archive = archive_service.find_one(req=None, _id=item_id)
    text = _get_html_from_image_data(archive['renditions'], **meta)
    return {
        'item_type': 'image',
        'meta': {
            'media': {
                '_id': item_id,
                'renditions': archive['renditions']
            },
            'caption': meta.get('caption', ''),
            'credit': meta.get('credit', '')
        },
        'text': text
    }


def get_producer_post_id(in_syndication, post_id):
    """Helps to denormalize syndication producer blog post data and provide unique value for producer_post_id field."""
    return '{}:{}:{}'.format(
        in_syndication['producer_id'],
        in_syndication['producer_blog_id'],
        post_id
    )


def extract_producer_post_data(post, fields=('_id', '_updated', 'highlight', 'sticky', 'post_status')):
    """Extract only useful data from original producer blog post."""
    return {key: post[key] for key in fields}


def get_post_creator(post):
    """Get publisher/author from consumer post."""
    try:
        ref = post['groups'][1]['refs'][0]
    except (KeyError, IndexError):
        return

    items_service = get_resource_service('blog_items')
    item = items_service.find_one(req=None, guid=ref['guid'])

    if item:
        return item.get('original_creator')


def create_syndicated_blog_post(producer_post, items, in_syndication):
    """Create syndicted blog post data using producer post, fetched items and incoming syndication."""
    post_items = []
    for item in items:
        meta = item.pop('meta')
        if item['item_type'] == 'image':
            item = _fetch_and_create_image_item(
                renditions=meta['media']['renditions'],
                caption=meta['caption'],
                credit=meta['credit']
            )
        item['blog'] = in_syndication['blog_id']
        post_items.append(item)

    items_service = get_resource_service('blog_items')
    item_ids = items_service.post(post_items)
    item_refs = []
    for i, item_id in enumerate(item_ids):
        item_refs.append({
            'residRef': str(item_id)
        })

    auto_publish = in_syndication.get('auto_publish', False)
    if auto_publish:
        post_status = 'open'
    else:
        post_status = 'submitted'

    producer_post_id = get_producer_post_id(in_syndication, producer_post['_id'])
    new_post = {
        'blog': in_syndication['blog_id'],
        'groups': [
            {
                'id': 'root',
                'role': 'grpRole:NEP',
                'refs': [
                    {'idRef': 'main'}
                ]
            },
            {
                'id': 'main',
                'role': 'grpRole:Main',
                'refs': item_refs
            }
        ],
        'highlight': False,
        'sticky': False,
        'syndication_in': in_syndication['_id'],
        'particular_type': 'post',
        'post_status': post_status,
        'producer_post_id': producer_post_id
    }
    return new_post
