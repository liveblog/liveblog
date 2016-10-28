import logging
from superdesk.resource import Resource
from superdesk.services import BaseService
from .utils import generate_api_key

logger = logging.getLogger('superdesk')


consumers_schema = {
    'name': {
        'type': 'string'
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
    'api_key': {
        'type': 'string',
        'unique': True
    },
    'api_url': {
        'type': 'string',
        'required': True
    }
}


class ConsumerService(BaseService):
    notification_key = 'consumers'

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            if not doc.get('api_key'):
                doc['api_key'] = generate_api_key()


class ConsumerResource(Resource):
    datasource = {
        'source': 'consumers',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'consumers', 'PATCH': 'consumers', 'PUT': 'consumers', 'DELETE': 'consumers'}
    schema = consumers_schema
