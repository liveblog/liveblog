import logging
from bson import ObjectId
from urllib.parse import urljoin
from superdesk.resource import Resource
from superdesk.services import BaseService
from .syndication import WEBHOOK_METHODS
from .utils import generate_api_key, trailing_slash, send_api_request
from .exceptions import APIConnectionError, ConsumerAPIError


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

    def _get_consumer(self, consumer):
        if isinstance(consumer, (str, ObjectId)):
            consumer = self.find_one(_id=consumer, req=None)
        return consumer

    def _get_api_url(self, consumer, url_path=None):
        api_url = trailing_slash(consumer['api_url'])
        if api_url and url_path:
            return urljoin(api_url, url_path)
        return api_url

    def _send_api_request(self, consumer_id, consumer_blog_token, url_path, method='GET', data=None, json_loads=True,
                          timeout=5):
        consumer = self._get_consumer(consumer_id)
        if not consumer:
            raise ConsumerAPIError('Unable to get consumer "{}".'.format(consumer_id))

        api_url = self._get_api_url(consumer, url_path)
        if not api_url:
            raise ConsumerAPIError('Unable to get consumer "{}" api url.'.format(consumer_id))

        try:
            response = send_api_request(api_url, consumer_blog_token, method=method, data=data, json_loads=json_loads,
                                        timeout=timeout)
        except APIConnectionError as e:
            raise ConsumerAPIError(str(e))
        else:
            return response

    def send_post(self, syndication_out, new_post, action='created'):
        blog_token = syndication_out['token']
        consumer_id = syndication_out['consumer_id']
        endpoint = 'syndication/webhook'
        if action not in WEBHOOK_METHODS:
            raise NotImplementedError('send_syndication_post "{}" not implemented yet.'.format(action))
        else:
            return self._send_api_request(consumer_id, blog_token, endpoint, method=WEBHOOK_METHODS[action],
                                          data=new_post)

    def on_create(self, docs):
        super().on_create(docs)
        for doc in docs:
            if not doc.get('api_key'):
                doc['api_key'] = generate_api_key()

    def on_update(self, updates, original):
        super().on_update(updates, original)
        if 'api_key' in updates and updates['api_key'] != original['api_key']:
            updates['api_key'] = generate_api_key()


class ConsumerResource(Resource):
    datasource = {
        'source': 'consumers',
        'search_backend': None,
        'default_sort': [('_updated', -1)],
    }

    item_methods = ['GET', 'PATCH', 'PUT', 'DELETE']
    privileges = {'POST': 'consumers', 'PATCH': 'consumers', 'PUT': 'consumers', 'DELETE': 'consumers'}
    schema = consumers_schema
