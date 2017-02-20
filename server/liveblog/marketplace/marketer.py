import logging
import requests
import json
from flask import Blueprint, request
from flask_cors import CORS
from liveblog.syndication.utils import api_response, api_error
from liveblog.syndication.exceptions import APIConnectionError
from settings import MARKETPLACE_APP_URL
from requests.exceptions import RequestException
from requests.packages.urllib3.exceptions import MaxRetryError
from urllib.parse import urljoin


logger = logging.getLogger('superdesk')
marketers_blueprint = Blueprint('marketers', __name__)
CORS(marketers_blueprint)


@marketers_blueprint.route('/api/marketplace/blogs', methods=['GET'])
def blogs():
    # Use marketplace app to retrieve blogs of all marketers
    try:
        response = _send_marketplace_api_request(MARKETPLACE_APP_URL, 'blogs', request.args)
    except APIConnectionError as e:
        return api_response(str(e), 500)

    if response.status_code == 200:
        return api_response(response.content, 200, json_dumps=False)
    else:
        return api_error('Unable to get blogs from marketplace.', response.status_code)


# For retrieving a list of marketers from the market place app
@marketers_blueprint.route('/api/marketplace/marketers', methods=['GET'])
def marketers():
    # Use marketplace app url to retrieve marketers
    try:
        response = _send_marketplace_api_request(MARKETPLACE_APP_URL, 'marketers', request.args)
    except APIConnectionError as e:
        return api_response(str(e), 500)

    if response.status_code == 200:
        # Update picture_url - bit of a hack until we settle on a storage solution for the marketplace app
        url = MARKETPLACE_APP_URL
        if not url.endswith('/'):
            url = '{}/'.format(url)
        content = json.loads(response.content.decode('utf-8'))
        for item in content['_items']:
            picture_url = item['picture_url']
            picture_url = picture_url.replace("/api/", "")
            item['picture_url'] = url + picture_url
        response_content = json.dumps(content)
        return api_response(response_content, response.status_code, json_dumps=False)
    else:
        return api_error('Unable to get marketers.', response.status_code)


# For retrieving list of blogs available in marketplace from given source
@marketers_blueprint.route('/api/marketplace/marketers/<marketer_id>/blogs', methods=['GET'])
def marketer_blogs(marketer_id):
    # Use marketplace app url to retrieve marketer by id
    uri = 'marketers/{}'.format(marketer_id)
    try:
        response = _send_marketplace_api_request(MARKETPLACE_APP_URL, uri)
    except APIConnectionError as e:
        return api_response(str(e), 500)

    if response.status_code != 200:
        return api_error('Unable to get marketer.', response.status_code)

    marketer = json.loads(response.content.decode('utf-8'))

    # Use marketer url to call /marketplace/blogs
    url = marketer['url']
    try:
        response = _send_marketplace_api_request(url, 'marketed/blogs', request.args)
    except APIConnectionError as e:
        return api_response(str(e), 500)

    if response.status_code == 200:
        # Add marketer name to each blog
        content = json.loads(response.content.decode('utf-8'))
        for item in content['_items']:
            item['marketer_name'] = marketer['name']
        response_content = json.dumps(content)
        return api_response(response_content, response.status_code, json_dumps=False)
    else:
        return api_error('Unable to get blogs of marketers.', response.status_code)


def _send_marketplace_api_request(url, uri, params=None, timeout=5):
    method = 'GET'
    if not url.endswith('/'):
        url = '{}/'.format(url)

    url = urljoin(url, uri)

    logger.info('API {} request to {}'.format(method, url))
    try:
        response = requests.request(method, url, headers={
            'Content-Type': 'application/json'
        }, params=params, data=None, timeout=timeout)
    except (ConnectionError, RequestException, MaxRetryError):
        raise APIConnectionError('Unable to connect to api_url "{}".'.format(url))

    logger.warning('API {} request to {} - response: {} {}'.format(
        'GET', url, response.status_code, response.content
    ))

    return response


# marketers_blueprint.before_request(blueprint_superdesk_token_auth)
