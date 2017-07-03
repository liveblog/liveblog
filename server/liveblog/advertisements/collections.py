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
                    'advertisement_id': Resource.rel('advertisements', embeddable=True),
                }
            },
            'nullable': True
        },
        'deleted': {
            'type': 'boolean',
            'default': False
        }
    }
    datasource = {
        'source': 'collections',
        'default_sort': [('name', 1)]
    }
    RESOURCE_METHODS = ['GET', 'POST']
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'collections', 'POST': 'collections',
                  'PATCH': 'collections', 'DELETE': 'collections'}


class CollectionsService(BaseService):
    def delete_advertisement(self, advertisement):
        # find all collections that contains ` advertisement`
        collections = self.find({'advertisements': {'$elemMatch': {'advertisement_id': advertisement.get('_id')}}})
        for collection in collections:
            advertisements = collection.get('advertisements')
            # remove advertisement from `advertisements`
            advertisements.remove({'advertisement_id': advertisement.get('_id')})
            self.system_update(collection['_id'], {'advertisements': advertisements}, collection)

    def update_advertisement(self, advertisement):
        # find all collections that contains ` advertisement`
        collections = self.find({'advertisements': {'$elemMatch': {'advertisement_id': advertisement.get('_id')}}})
        for collection in collections:
            self.system_update(collection['_id'], {}, collection)
