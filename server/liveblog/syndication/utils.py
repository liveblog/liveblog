import json
import uuid
import hmac
import logging
import requests
from eve.io.mongo import MongoJSONEncoder
from requests.exceptions import Timeout
from bson import ObjectId
from hashlib import sha1
from flask import make_response
from .exceptions import APIConnectionError


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
    except (ConnectionError, Timeout):
        raise APIConnectionError('Unable to connect to api_url "{}".'.format(api_url))

    logger.info('API {} request to {} - response: {} {}'.format(
        method, api_url, response.status_code, response.content
    ))

    if not json_loads:
        return response
    else:
        return response.json()
