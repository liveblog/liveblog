from superdesk.resource import Resource
from superdesk.services import BaseService
from eve.utils import ParsedRequest
from settings import SUPPORTED_THEMES


class ThemesResource(Resource):

    schema = {
        'name': {
            'type': 'string',
            'allowed': SUPPORTED_THEMES['themes']
        }
    }

    datasource = {
        'default_sort': [('_updated', -1)]
    }

    ITEM_METHODS = ['GET', 'POST', 'DELETE']

    privileges = {'GET': 'blogs', 'POST': 'blogs', 'PATCH': 'blogs', 'DELETE': 'blogs'}


class ThemesService(BaseService):

    def on_create(self, docs):
        for doc in docs:
            doc['colour'] = SUPPORTED_THEMES['themes'][doc['name']]

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('themes', req=req, lookup=lookup)
