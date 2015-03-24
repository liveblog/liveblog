# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from superdesk.resource import Resource
from superdesk.services import BaseService
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
        'source': 'languages',
        'default_sort': [('language_name', 1)]
    }
    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'global_preferences', 'POST': 'global_preferences',
                  'PATCH': 'global_preferences', 'DELETE': 'global_preferences'}


class LanguagesService(BaseService):
    def on_create(self, docs):
        for doc in docs:
            doc['name'] = SUPPORTED_LANGUAGES['languages'][doc['language_code']]
