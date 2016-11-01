import json
import uuid
import hmac
from hashlib import sha1
from flask import make_response


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
