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


class OutputsResource(Resource):
    schema = {
        'name': {
            'type': 'string',
            'unique': True
        },
        'collection': Resource.rel('collections', True),
        'blog': Resource.rel('blogs'),
        'theme': Resource.rel('themes'),
        'style': {
            'type': 'dict',
            'schema': {
                'background-color': {
                    'type': 'string'
                },
                'background-image': {
                    'type': 'string'
                }
            }
        },
        'deleted': {
            'type': 'boolean',
            'default': False
        }
    }
    datasource = {
        'source': 'outputs',
        'default_sort': [('name', 1)]
    }
    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'outputs', 'POST': 'outputs',
                  'PATCH': 'outputs', 'DELETE': 'outputs'}


class OutputsService(BaseService):
    def on_updated(self, updates, original):
        super().on_updated(updates, original)

        # @TODO: deletes s3 blog
        if updates.get('deleted', False):
            pass
