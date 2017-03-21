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


class CollectionsResource(Resource):
    schema = {
        'name': {
            'type': 'string',
            'unique': True
        },
        'advertisements': {
            'type': 'list',
            'schema': {
                'type': 'dict',
                'schema': {
                    'advertisement_id': Resource.rel('advertisements'),
                }
            },
            'nullable': True
        }
    }
    datasource = {
        'source': 'collections',
        'default_sort': [('name', 1)]
    }
    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'global_preferences', 'POST': 'global_preferences',
                  'PATCH': 'global_preferences', 'DELETE': 'global_preferences'}


class CollectionsService(BaseService):
    pass
