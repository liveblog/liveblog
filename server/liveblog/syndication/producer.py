import json
import logging
from urllib.parse import urljoin
import requests
from requests.exceptions import ConnectionError
from flask import abort
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import Blueprint, make_response
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


class ProducerService(BaseService):
    notification_key = 'producers'


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


def _make_json_response(data, dumps=True):
    if dumps:
        data = json.dumps(data)
    response = make_response(data)
    response.mimetype = 'application/json'
    return response


@producers_blueprint.route('/api/producers/<producer_id>/blogs', methods=['GET'])
def producer_blogs(producer_id):
    producer = get_resource_service('producers').find_one(req=None, _id=producer_id)
    if not producer:
        return _make_json_response(_make_error('Unable to get producer.'))

    api_url = producer['api_url']
    if not api_url.endswith('/'):
        api_url = '{}/'.format(api_url)

    api_url = urljoin(api_url, 'syndication/blogs')
    try:
        response = requests.get(api_url, headers={
            'Authorization': producer['consumer_api_key'],
            'Origin': 'localhost',
            'Content-Type': 'application/json'
        })
    except ConnectionError:
        return _make_json_response(_make_error('Unable to connect to producer: {}'.format(api_url)))
    else:
        status_code = response.status_code
        if status_code == 200:
            return _make_json_response(response.content, dumps=False)
        else:
            return _make_json_response(_make_error('Unable to get producer blogs ({})'.format(status_code)))


def _producers_blueprint_auth():
    auth = SuperdeskTokenAuth()
    authorized = auth.authorized(allowed_roles=[], resource='producers', method='GET')
    if not authorized:
        return abort(401, 'Authorization failed.')


producers_blueprint.before_request(_producers_blueprint_auth)
