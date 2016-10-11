import logging
from superdesk.resource import Resource
from superdesk.services import BaseService


logger = logging.getLogger('superdesk')


consumers_schema = {
    'name': {
        'type': 'string'
    },
    'domain': {
        'type': 'string',
        'schema': {
            'type': 'string',
            'required': True,
            'unique': True
        }
    },
    'contacts': {
        'type': 'list',
        'schema': {
            'type': 'dict',
            'schema': {
                'consumer_contacts': Resource.rel('consumer_contacts', True)
            }
        }
    },
    'api_key': {
        'type': 'string',
        'schema': {
            'type': 'string',
            'nullable': True
        }
    }
}


class ConsumerService(BaseService):
    notification_key = 'consumer'


class ConsumerResource(Resource):
    datasource = {
        'source': 'consumers',
        'search_backend': 'elastic',
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'consumers', 'PATCH': 'consumers', 'PUT': 'consumers', 'DELETE': 'consumers'}
    schema = consumers_schema


consumers_contacts_schema = {
    'first_name': {
        'type': 'string',
    },
    'last_name': {
        'type': 'string',
    },
    'display_name': {
        'type': 'string'
    },
    'email': {
        'unique': True,
        'type': 'email',
        'required': True
    },
    'phone': {
        'type': 'string',
        'nullable': True
    },
    'language': {
        'type': 'string',
        'nullable': True
    }
}


class ConsumerContactService(BaseService):
    notification_key = 'consumer_contact'


class ConsumerContactResource(Resource):
    datasource = {
        'source': 'consumers_contacts',
        'search_backend': 'elastic',
        'default_sort': [('_updated', -1)]
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'consumers', 'PATCH': 'consumers', 'PUT': 'consumers', 'DELETE': 'consumers'}
    schema = consumers_contacts_schema
