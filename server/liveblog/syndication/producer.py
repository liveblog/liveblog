import json
import logging
from urllib.parse import urljoin
import requests
from requests.exceptions import ConnectionError, Timeout
from flask import abort
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import Blueprint, request
from apps.auth import SuperdeskTokenAuth
from flask_cors import CORS
from .utils import trailing_slash, api_response, api_error


logger = logging.getLogger('superdesk')
producers_blueprint = Blueprint('producers', __name__)
CORS(producers_blueprint)


producers_schema = {
    'name': {
        'type': 'string',
        'required': True
    },
    'api_url': {
        'type': 'string',
        'required': True
    },
    'consumer_api_key': {
        'type': 'string',
        'required': True
    }
}


class ProducerAPIError(Exception):
    pass


class ProducerService(BaseService):
    notification_key = 'producers'

    def _get_producer(self, producer):
        if isinstance(producer, str):
            producer = self.find_one(_id=producer, req=None)
        return producer

    def _get_api_url(self, producer, url_path=None):
        api_url = trailing_slash(producer['api_url'])
        if api_url and url_path:
            return urljoin(api_url, url_path)
        return api_url

    def _send_api_request(self, producer_id, url_path, method='GET', data=None, json_loads=True, timeout=5):
        producer = self._get_producer(producer_id)
        if not producer:
            raise ProducerAPIError('Unable to get producer "{}".'.format(producer_id))

        api_url = self._get_api_url(producer, url_path)
        if not api_url:
            raise ProducerAPIError('Unable to get producer "{}" api url.'.format(producer_id))

        if data:
            data = json.dumps(data)

        logger.info('API {} request to {} with params={} and data={}'.format(method, api_url, request.args, data))
        try:
            response = requests.request(method, api_url, headers={
                'Authorization': producer['consumer_api_key'],
                'Content-Type': 'application/json'
            }, params=request.args, data=data, timeout=timeout)
        except (ConnectionError, Timeout):
            raise ProducerAPIError('Unable to connect to producer: "{}".'.format(api_url))

        logger.info('API {} request to {} - response: {} {}'.format(
            method, api_url, response.status_code, response.content
        ))

        if not json_loads:
            return response
        else:
            return response.json()

    def get_blogs(self, producer_id, json_loads=True):
        return self._send_api_request(producer_id, 'syndication/blogs', json_loads=json_loads)

    def get_blog(self, producer_id, blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}'.format(blog_id)
        return self._send_api_request(producer_id, url_path, json_loads=json_loads)

    def syndicate(self, producer_id, blog_id, consumer_blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}/syndicate'.format(blog_id)
        data = {'consumer_blog_id': consumer_blog_id}
        return self._send_api_request(producer_id, url_path, method='POST', data=data, json_loads=json_loads)


class ProducerResource(Resource):
    datasource = {
        'source': 'producers',
        'search_backend': None,
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'producers', 'PATCH': 'producers', 'PUT': 'producers', 'DELETE': 'producers'}
    schema = producers_schema


@producers_blueprint.route('/api/producers/<producer_id>/blogs', methods=['GET'])
def producer_blogs(producer_id):
    producers = get_resource_service('producers')
    try:
        response = producers.get_blogs(producer_id, json_loads=False)
    except ProducerAPIError as e:
        return api_response(str(e), 500)
    else:
        if response.status_code == 200:
            return api_response(response.content, response.status_code, json_dumps=False)
        else:
            return api_error('Unable to get producer blogs.', response.status_code)


@producers_blueprint.route('/api/producers/<producer_id>/blogs/<blog_id>', methods=['GET'])
def producer_blog(producer_id, blog_id):
    producers = get_resource_service('producers')
    try:
        response = producers.get_blog(producer_id, blog_id, json_loads=False)
    except ProducerAPIError as e:
        return api_response(str(e), 500)
    else:
        if response.status_code == 200:
            return api_response(response.content, response.status_code, json_dumps=False)
        else:
            return api_error('Unable to get producer blogs.', response.status_code)


@producers_blueprint.route('/api/producers/<producer_id>/syndicate/<blog_id>', methods=['POST'])
def producer_blogs_syndicate(producer_id, blog_id):
    producers = get_resource_service('producers')
    in_service = get_resource_service('syndication_in')

    consumer_blog_id = request.get_json().get('consumer_blog_id')
    if not consumer_blog_id:
        return api_error('Missing "consumer_blog_id" in form data.', 422)

    if in_service.is_syndicated(producer_id, blog_id, consumer_blog_id):
        return api_error('Syndication already sent for blog "{}".'.format(blog_id), 409)

    try:
        response = producers.syndicate(producer_id, blog_id, consumer_blog_id, json_loads=False)
    except ProducerAPIError as e:
        return api_response(str(e), 500)
    else:
        if response.status_code == 201:
            syndication = response.json()
            in_service.post([{
                'blog_id': syndication['consumer_blog_id'],
                'blog_token': syndication['token'],
                'producer_id': producer_id,
                'producer_blog_id': blog_id,
            }])
            return api_response(response.content, response.status_code, json_dumps=False)
        else:
            return api_error('Unable to syndicate producer blog.', response.status_code)


def _producers_blueprint_auth():
    auth = SuperdeskTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='producers', method='GET')
    if not authorized:
        return abort(401, 'Authorization failed.')


producers_blueprint.before_request(_producers_blueprint_auth)
