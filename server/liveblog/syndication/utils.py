import json
import hmac
import logging
import tempfile
import urllib.parse
import uuid
from flask import abort
import requests
from bson import ObjectId
from hashlib import sha1
from eve.io.mongo import MongoJSONEncoder
from requests.exceptions import RequestException, ConnectionError, ConnectTimeout
from requests.packages.urllib3.exceptions import MaxRetryError
from superdesk import get_resource_service
from superdesk.metadata.item import ITEM_TYPE, CONTENT_TYPE
from apps.auth import SuperdeskTokenAuth
from .exceptions import APIConnectionError, DownloadError
from werkzeug.datastructures import FileStorage

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

    session = requests.Session()
    session.trust_env = False
    adapter = requests.adapters.HTTPAdapter(max_retries=0)
    session.mount('http://', adapter)
    session.mount('https://', adapter)

    logger.debug('API {} request to {} with params={} and data={}'.format(method, api_url, args, data))
    headers = {
        'Content-Type': 'application/json'
    }
    if api_key:
        headers['Authorization'] = api_key

    try:
        response = requests.request(method, api_url, headers=headers, params=args, data=data, timeout=timeout)
    except (ConnectionError, ConnectTimeout, RequestException, MaxRetryError):
        raise APIConnectionError('Unable to connect to api_url "{}".'.format(api_url))

    logger.debug('API {} request to {} - response: {} {}'.format(
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


def blueprint_superdesk_token_auth():
    auth = SuperdeskTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='producers', method='GET')
    if not authorized:
        return abort(401, 'Authorization failed.')


def extract_post_items_data(original_doc):
    """Extract blog post items."""
    items_service = get_resource_service('items')
    user_service = get_resource_service('users')
    item_type = original_doc.get(ITEM_TYPE, '')
    if item_type != CONTENT_TYPE.COMPOSITE:
        raise NotImplementedError('Post item_type "{}" not supported.'.format(item_type))

    items = []
    needed_fields = ("avatar", "avatar_renditions", "byline",
                     "display_name", "email", "first_name",
                     "last_name", "picture_url", "sign_off",
                     "username", "_id", "_created", "_updated")

    for group in original_doc['groups']:
        if group['id'] == 'main':
            for ref in group['refs']:
                item = items_service.find_one(req=None, guid=ref['guid'])
                syndicated_creator = user_service.find_one(req=None, _id=item['original_creator'])
                syndicated_obj = None
                if syndicated_creator:
                    syndicated_obj = {k: v for k, v in syndicated_creator.items() if k in needed_fields}
                text = item.get('text')
                item_type = item.get('item_type')
                group_type = item.get('group_type')
                meta = item.get('meta', {})
                data = {
                    'text': text,
                    'item_type': item_type,
                    'group_type': group_type,
                    'commenter': item.get('commenter'),
                    'syndicated_creator': syndicated_obj,
                    'meta': meta
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


def _fetch_and_create_image_item(item):
    """Download and create image item from producer blog post renditions"""
    meta = item.get('meta')
    renditions = meta.get('media', {}).get('renditions')
    try:
        image_url = renditions['original']['href']
        mimetype = renditions['original']['mimetype']
    except KeyError:
        raise DownloadError('Unable to get original image from renditions: {}'.format(renditions))

    item_data = dict()
    item_data['type'] = 'picture'
    item_data['media'] = FileStorage(stream=fetch_url(image_url), content_type=mimetype)
    archive_service = get_resource_service('archive')
    item_id = archive_service.post([item_data])[0]
    archive = archive_service.find_one(req=None, _id=item_id)
    text = _get_html_from_image_data(archive['renditions'], **meta)
    return {
        'item_type': 'image',
        'syndicated_creator': item.get('syndicated_creator'),
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
    return '{}:{}:{}:{}'.format(
        in_syndication['blog_id'],
        in_syndication['producer_id'],
        in_syndication['producer_blog_id'],
        post_id
    )


def extract_producer_post_data(post, fields=('_id', '_updated', 'lb_highlight', 'sticky', 'post_status',
                                             'published_date')):
    """Extract only useful data from original producer blog post."""
    return {key: post.get(key) for key in fields}


def get_post_creator(post):
    """Get publisher/author from consumer post."""
    ref = None
    for group in post['groups']:
        if group['id'] == 'main':
            ref = group['refs'][0]
    if ref:
        items_service = get_resource_service('blog_items')
        item = items_service.find_one(req=None, guid=ref['residRef'])

        if item:
            return item.get('original_creator')


def create_syndicated_blog_post(producer_post, items, in_syndication):
    """Create syndicted blog post data using producer post, fetched items and incoming syndication."""
    post_items = []
    for item in items:
        if item['item_type'] == 'image':
            item = _fetch_and_create_image_item(item)
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
        'lb_highlight': producer_post['lb_highlight'] if 'lb_highlight' in producer_post.keys() else False,
        'sticky': producer_post['sticky'] if 'sticky' in producer_post.keys() else False,
        'syndication_in': in_syndication['_id'],
        'particular_type': 'post',
        'post_status': post_status,
        'producer_post_id': producer_post_id,
        'deleted': False
    }

    if 'published_date' in producer_post.keys():
        new_post['published_date'] = producer_post['published_date']

    return new_post


def validate_secure_url(value):
    """Check if url is secure (https or whitelist)"""
    parsed = urllib.parse.urlparse(value)
    # TODO: add whitelist app settings.
    try:
        netloc = parsed.netloc.split(':')[0]
    except IndexError:
        netloc = parsed.netloc
    if netloc in ('localhost', '127.0.0.1') or netloc.endswith('.local'):
        return True
    if parsed.scheme != 'https':
        return False
    else:
        return True
