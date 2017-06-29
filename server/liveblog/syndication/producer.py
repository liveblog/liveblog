import logging
from bson import ObjectId
from urllib.parse import urljoin
from superdesk.resource import Resource
from superdesk.services import BaseService
from flask import Blueprint, request
from flask_cors import CORS
from eve.utils import str_to_date
from superdesk import get_resource_service
from flask import current_app as app
from liveblog.utils.api import api_response, api_error
from .exceptions import APIConnectionError, ProducerAPIError
from .utils import trailing_slash, send_api_request, blueprint_superdesk_token_auth
from .tasks import check_api_status

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
        'uniqueurl': True,
        'httpsurl': {
            'key_field': 'consumer_api_key',
            'check_auth': True
        }
    },
    'consumer_api_key': {
        'type': 'string',
        'required': True
    },
    'api_status': {
        'allowed': ['enabled', 'invalid_key', 'invalid_url'],
        'default': 'enabled'
    }
}


class ProducerService(BaseService):
    notification_key = 'producers'

    def _cursor(self, resource=None):
        resource = resource or self.datasource
        return app.data.mongo.pymongo(resource=resource).db[resource]

    def _get_producer(self, producer):
        if isinstance(producer, (str, ObjectId)):
            producer = self.find_one(_id=producer, req=None)
        return producer

    def _get_api_url(self, producer, url_path=None):
        api_url = trailing_slash(producer['api_url'])
        if api_url and url_path:
            return urljoin(api_url, url_path)
        return api_url

    def _send_api_request(self, producer_id, url_path, method='GET', data=None, json_loads=True, timeout=10):
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
            logger.exception('Unable to connect to {}'.format(api_url))
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

    def syndicate(self, producer_id, blog_id, consumer_blog_id, auto_retrieve, start_date, update=False,
                  json_loads=True):
        url_path = 'syndication/blogs/{}/syndicate'.format(blog_id)
        data = {
            'start_date': start_date,
            'auto_retrieve': auto_retrieve,
            'consumer_blog_id': consumer_blog_id
        }
        if not update:
            method = 'POST'
        else:
            method = 'PATCH'
        return self._send_api_request(producer_id, url_path, method=method, data=data, json_loads=json_loads)

    def unsyndicate(self, producer_id, blog_id, consumer_blog_id, json_loads=True):
        url_path = 'syndication/blogs/{}/syndicate'.format(blog_id)
        data = {'consumer_blog_id': consumer_blog_id}
        return self._send_api_request(producer_id, url_path, method='DELETE', data=data, json_loads=json_loads)

    def on_create(self, docs):
        for doc in docs:
            if 'api_url' in doc:
                doc['api_url'] = trailing_slash(doc['api_url'])
        super().on_create(docs)

    def on_created(self, docs):
        for doc in docs:
            check_api_status.delay(doc)

    def on_update(self, updates, original):
        if 'api_url' in updates:
            updates['api_url'] = trailing_slash(updates['api_url'])
        super().on_update(updates, original)

    def on_updated(self, updates, original):
        original = original.copy()
        original.update(updates)
        check_api_status.delay(original)
        super().on_updated(updates, original)


class ProducerResource(Resource):
    datasource = {
        'source': 'producers',
        'search_backend': None,
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'producers', 'PATCH': 'producers', 'PUT': 'producers', 'DELETE': 'producers'}
    schema = producers_schema


def _response_status(code):
    """If unauthorized, it returns 400 instead of 401 to prevent"""
    if code == 401:
        logger.warning('Unauthorized. Returning 400 to prevent client logout.')
        return 400
    return code


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
            return api_error('Unable to get producer blogs.', _response_status(response.status_code))


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
            return api_error('Unable to get producer blog "{}".'.format(blog_id),
                             _response_status(response.status_code))


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
            return api_error('Unable to get producer blog posts.', _response_status(response.status_code))


def _create_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id, auto_publish, auto_retrieve,
                                     start_date=None):
    producers = get_resource_service('producers')
    in_service = get_resource_service('syndication_in')
    in_syndication = in_service.get_syndication(producer_id, blog_id, consumer_blog_id)
    if in_syndication:
        return api_error('Syndication already sent for blog "{}".'.format(blog_id), 409)

    try:
        response = producers.syndicate(producer_id, blog_id, consumer_blog_id, auto_retrieve, start_date,
                                       json_loads=False)
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
                'auto_publish': auto_publish,
                'auto_retrieve': auto_retrieve,
                'start_date': start_date
            }])
            return api_response(response.content, response.status_code, json_dumps=False)
        elif response.status_code == 409:
            return api_error('Syndication already sent for blog "{}"'.format(blog_id), 409)
        else:
            return api_error('Unable to syndicate producer blog.', _response_status(response.status_code))


def _update_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id, auto_retrieve, start_date):
    producers = get_resource_service('producers')
    in_service = get_resource_service('syndication_in')
    in_syndication = in_service.get_syndication(producer_id, blog_id, consumer_blog_id)
    if not in_syndication:
        return api_error('Syndication not sent for blog "{}".'.format(blog_id), 409)

    try:
        response = producers.syndicate(producer_id, blog_id, consumer_blog_id, start_date, update=True,
                                       json_loads=False)
    except ProducerAPIError as e:
        return api_response(str(e), 500)
    else:
        if response.status_code == 200:
            syndication_in = in_service.get_syndication(producer_id, blog_id, consumer_blog_id)
            in_service.update(syndication_in['_id'], {
                'auto_retrieve': auto_retrieve,
                'start_date': start_date
            }, syndication_in)
            del syndication_in['blog_token']
            return api_response(syndication_in, 200)
        elif response.status_code == 404:
            return api_error('Syndication not sent for blog "{}"'.format(blog_id), 409)
        else:
            return api_error('Unable to update blog syndication.', _response_status(response.status_code))


def _delete_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id):
    producers = get_resource_service('producers')
    in_service = get_resource_service('syndication_in')
    syndication_in = in_service.get_syndication(producer_id, blog_id, consumer_blog_id)
    if not syndication_in:
        logger.warning('Syndication not sent for blog "{}".'.format(blog_id))
        return api_response({}, 204)
    else:
        try:
            response = producers.unsyndicate(producer_id, blog_id, consumer_blog_id, json_loads=False)
        except ProducerAPIError as e:
            return api_response(str(e), 500)
        else:
            if response.status_code == 204:
                syndication_id = syndication_in['_id']
                in_service.delete_action(lookup={'_id': syndication_id})
                return api_response(response.content, response.status_code, json_dumps=False)
            else:
                return api_error('Unable to unsyndicate producer blog.', _response_status(response.status_code))


@producers_blueprint.route('/api/producers/<producer_id>/syndicate/<blog_id>', methods=['POST', 'PATCH', 'DELETE'])
def producer_blogs_syndicate(producer_id, blog_id):
    data = request.get_json(silent=True) or {}
    consumer_blog_id = data.get('consumer_blog_id')
    auto_publish = data.get('auto_publish')
    auto_retrieve = data.get('auto_retrieve', True)
    start_date = data.get('start_date')

    if not consumer_blog_id:
        return api_error('Missing "consumer_blog_id" in form data.', 422)

    if start_date:
        try:
            start_date = str_to_date(start_date)
        except ValueError:
            return api_error('start_date is not valid.', 400)

    if request.method == 'DELETE':
        return _delete_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id)
    elif request.method == 'PATCH':
        return _update_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id, auto_retrieve, start_date)
    else:
        return _create_producer_blogs_syndicate(producer_id, blog_id, consumer_blog_id, auto_publish, auto_retrieve,
                                                start_date)


@producers_blueprint.route('/api/producers/<producer_id>/check_connection', methods=['GET'])
def producer_check_connection(producer_id):
    producers = get_resource_service('producers')
    producer = producers.find_one(_id=producer_id, req=None)
    if not producer:
        return api_response('invalid_producer_id', 404)
    check_api_status(producer)
    return api_response('OK', 200)


producers_blueprint.before_request(blueprint_superdesk_token_auth)
