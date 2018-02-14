# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from flask import Blueprint
from flask_cors import CORS
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service

from liveblog.utils.api import api_response, api_error

advertisements_blueprint = Blueprint('foo', __name__)
CORS(advertisements_blueprint)


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


@advertisements_blueprint.route('/api/advertisements/<blog_id>/<output>/')
def get_advertisements(blog_id, output):
    """@TODO: add docstrings"""

    # if the `output` is the `_id` get the data.
    if output:
        if isinstance(output, str):
            output = get_resource_service('outputs').find_one(req=None, _id=output)
        if not output:
            return api_error('output not found', 404)
        else:
            collection = get_resource_service('collections').find_one(req=None, _id=output.get('collection'))
            output['collection'] = collection

    if output and output.get('collection', False):
        ads_ids = output['collection'].get('advertisements', [])
        ads_ids = list(map(lambda x: x['advertisement_id'], ads_ids))

        ads_query = get_resource_service('advertisements').find({"_id": {"$in": ads_ids}})
        ads = list(ads_query)

        # looping over them, not sure which one is more performant
        # ads = []
        # if output['collection'].get('advertisements'):
        #     for ad in output['collection']['advertisements']:
        #         ads.append(get_resource_service('advertisements').find_one(req=None, _id=ad['advertisement_id']))

    return api_response(ads, 200)
