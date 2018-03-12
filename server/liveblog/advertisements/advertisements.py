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
from superdesk import get_resource_service


class AdvertisementsResource(Resource):
    schema = {
        'name': {
            'type': 'string',
            'unique': True
        },
        'type': {
            'type': 'string',
            'allowed': ['Advertisement Local', 'Advertisement Remote', 'Advertisement Adsense'],
            'default': 'Advertisement Local'
        },
        'meta': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            },
            'nullable': True
        },
        'text': {
            'type': 'string'
        },
        'deleted': {
            'type': 'boolean',
            'default': False
        }
    }
    datasource = {
        'source': 'advertisements',
        'default_sort': [('name', 1)]
    }
    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'advertisements', 'POST': 'advertisements',
                  'PATCH': 'advertisements', 'DELETE': 'advertisements'}


class AdvertisementsService(BaseService):
    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        collections_service = get_resource_service('collections')

        # deletes advertisement from collection
        if updates.get('deleted', False):
            collections_service.delete_advertisement(original)
        # updates the collections, (caching issues)
        else:
            collections_service.update_advertisement(original)
