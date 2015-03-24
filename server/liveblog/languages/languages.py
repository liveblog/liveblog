from superdesk.resource import Resource
from superdesk.services import BaseService
from eve.utils import ParsedRequest
from settings import SUPPORTED_LANGUAGES


class LanguagesResource(Resource):

    schema = {
        'language_code': {
            'type': 'string',
            'allowed': SUPPORTED_LANGUAGES['languages']
        },
        'name': {
            'type': 'string'
        }
    }

    datasource = {
        'default_sort': [('language_name', 1)]
    }

    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class LanguagesService(BaseService):
    def on_create(self, docs):
        for doc in docs:
            doc['name'] = SUPPORTED_LANGUAGES['languages'][doc['language_code']]

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('languages', req=req, lookup=lookup)
