import logging
from urllib.parse import urljoin
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import abort, Blueprint, request
from apps.auth import SuperdeskTokenAuth
from flask_cors import CORS
from .utils import trailing_slash, api_response, api_error, send_api_request
from .exceptions import APIConnectionError, ProducerAPIError


logger = logging.getLogger('superdesk')
producers_blueprint = Blueprint('producers', __name__)
CORS(producers_blueprint)


producers_schema = {
    'name': {
        'type': 'string',
        'required': True
    },
    'contacts': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'first_name': {
                    'type': 'string',
                },
                'last_name': {
                    'type': 'string',
                },
                'email': {
                    'type': 'email',
                    'required': True
                },
                'phone': {
                    'type': 'string',
                    'nullable': True
                }
            }
        }
    },
    'api_url': {
        'type': 'string',
        'required': True,
        'unique': True
    },
    'consumer_api_key': {
        'type': 'string',
        'required': True
    }
}


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

        try:
            response = send_api_request(api_url, producer['consumer_api_key'], method=method, args=request.args,
                                        data=data, json_loads=json_loads, timeout=timeout)
        except APIConnectionError as e:
            raise ProducerAPIError(e)
        else:
            return response

    def get_blogs(self, producer_id, json_loads=True):
        return self._send_api_request(producer_id, 'syndication/blogs', json_loads=json_loads)

    def get_blog(self, producer_id, blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}'.format(blog_id)
        return self._send_api_request(producer_id, url_path, json_loads=json_loads)

    def get_blog_posts(self, producer_id, blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}/posts'.format(blog_id)
        return self._send_api_request(producer_id, url_path, json_loads=json_loads)

    def syndicate(self, producer_id, blog_id, consumer_blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}/syndicate'.format(blog_id)
        data = {'consumer_blog_id': consumer_blog_id}
        return self._send_api_request(producer_id, url_path, method='POST', data=data, json_loads=json_loads)

    def unsyndicate(self, producer_id, blog_id, consumer_blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}/syndicate'.format(blog_id)
        data = {'consumer_blog_id': consumer_blog_id}
        return self._send_api_request(producer_id, url_path, method='DELETE', data=data, json_loads=json_loads)


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
            return api_error('Unable to get producer blog "{}".'.format(blog_id), response.status_code)


@producers_blueprint.route('/api/producers/<producer_id>/blogs/<blog_id>/posts', methods=['GET'])
def producer_blog_posts(producer_id, blog_id):
    producers = get_resource_service('producers')
    try:
        response = producers.get_blog_posts(producer_id, blog_id, json_loads=False)
    except ProducerAPIError as e:
        return api_response(str(e), 500)
    else:
        if response.status_code == 200:
            return api_response(response.content, response.status_code, json_dumps=False)
        else:
            return api_error('Unable to get producer blog posts.', response.status_code)


def _create_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id, auto_publish):
    producers = get_resource_service('producers')
    in_service = get_resource_service('syndication_in')
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
                'producer_blog_title': syndication['producer_blog_title'],
                'auto_publish': auto_publish
            }])
            return api_response(response.content, response.status_code, json_dumps=False)
        elif response.status_code == 409:
            return api_error('Syndication already sent for blog "{}"'.format(blog_id), 409)
        else:
            return api_error('Unable to syndicate producer blog.', response.status_code)


def _delete_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id):
    producers = get_resource_service('producers')
    in_service = get_resource_service('syndication_in')
    if not in_service.is_syndicated(producer_id, blog_id, consumer_blog_id):
        return api_error('Syndication not sent for blog "{}".'.format(blog_id), 409)

    try:
        response = producers.unsyndicate(producer_id, blog_id, consumer_blog_id, json_loads=False)
    except ProducerAPIError as e:
        return api_response(str(e), 500)
    else:
        if response.status_code == 204:
            in_service.delete({
                '$and': [
                    {'blog_id': {'$eq': consumer_blog_id}},
                    {'producer_id': {'$eq': producer_id}},
                    {'producer_blog_id': {'$eq': blog_id}}
                ]
            })
            return api_response(response.content, response.status_code, json_dumps=False)
        else:
            return api_error('Unable to unsyndicate producer blog.', response.status_code)


@producers_blueprint.route('/api/producers/<producer_id>/syndicate/<blog_id>', methods=['POST', 'DELETE'])
def producer_blogs_syndicate(producer_id, blog_id):
    consumer_blog_id = request.get_json().get('consumer_blog_id')
    auto_publish = request.get_json().get('auto_publish')
    if not consumer_blog_id:
        return api_error('Missing "consumer_blog_id" in form data.', 422)

    if request.method == 'DELETE':
        return _delete_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id)
    else:
        return _create_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id, auto_publish)


def _producers_blueprint_auth():
    auth = SuperdeskTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='producers', method='GET')
    if not authorized:
        return abort(401, 'Authorization failed.')


producers_blueprint.before_request(_producers_blueprint_auth)
