import json
import logging
from urllib.parse import urljoin
import requests
from requests.exceptions import ConnectionError, Timeout
from flask import abort
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import Blueprint, make_response, request
from apps.auth import SuperdeskTokenAuth
from flask_cors import CORS

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

    def get_blogs(self, producer, raw_data=False):
        if isinstance(producer, int):
            producer = self.find_one(req=None, _id=producer)

        if not producer:
            raise ProducerAPIError('Unable to get producer {}'.format(producer))

        api_url = producer['api_url']
        if not api_url.endswith('/'):
            api_url = '{}/'.format(api_url)
        api_url = urljoin(api_url, 'syndication/blogs')

        try:
            response = requests.get(api_url, headers={
                'Authorization': producer['consumer_api_key'],
                'Origin': 'localhost',
                'Content-Type': 'application/json'
            }, params=request.args, timeout=5)
        except (ConnectionError, Timeout):
            raise ProducerAPIError('Unable to connect to producer: {}'.format(api_url))

        if raw_data:
            return response.content, response.status_code
        else:
            return response.json()


class ProducerResource(Resource):
    datasource = {
        'source': 'producers',
        'search_backend': None,
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'producers', 'PATCH': 'producers', 'PUT': 'producers', 'DELETE': 'producers'}
    schema = producers_schema


def _make_error(error_message):
    return {
        '_status': 'ERR',
        '_error': error_message
    }


def _make_json_response(data, status_code, dumps=True):
    if dumps:
        data = json.dumps(data)
    response = make_response(data)
    response.status_code = status_code
    response.mimetype = 'application/json'
    return response


@producers_blueprint.route('/api/producers/<producer_id>/blogs', methods=['GET'])
def producer_blogs(producer_id):
    service = get_resource_service('producers')
    producer = service.find_one(req=None, _id=producer_id)
    if not producer:
        return _make_json_response(_make_error('Unable to get producer.'), 404)
    try:
        blogs_data, status_code = service.get_blogs(producer, raw_data=True)
    except ProducerAPIError as e:
        return _make_json_response(str(e), 500)
    else:
        if status_code == 200:
            return _make_json_response(blogs_data, status_code, dumps=False)
        else:
            return _make_json_response(_make_error('Unable to get producer blogs'), status_code)


def _producers_blueprint_auth():
    auth = SuperdeskTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='producers', method='GET')
    if not authorized:
        return abort(401, 'Authorization failed.')


producers_blueprint.before_request(_producers_blueprint_auth)
