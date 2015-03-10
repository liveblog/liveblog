from superdesk.resource import Resource
from superdesk.services import BaseService
from eve.utils import ParsedRequest


class LanguagesResource(Resource):
    available_language = {'english': 'en', 'french': 'fr', 'deutsch': 'de', 'italian': 'it'}

    schema = {
        'language_code': {
            'type': 'string',
            'allowed': ['en', 'fr', 'de', 'it'],
            'required': True
        },
        'name': {
            'type': 'string'
        }
    }

    datasource = {
        'default_sort': [('_updated', -1)]
    }

    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class LanguagesService(BaseService):

    available_language = {'english': 'en', 'french': 'fr', 'deutsch': 'de', 'italian': 'it'}

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('languages', req=req, lookup=lookup)
