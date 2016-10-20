import logging
from superdesk.resource import Resource
from superdesk.services import BaseService

logger = logging.getLogger('superdesk')


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
