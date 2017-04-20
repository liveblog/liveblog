# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import logging

import superdesk
from eve.io.mongo import MongoJSONEncoder
from flask import json
from superdesk.resource import Resource
from superdesk.services import BaseService

from .app_settings import BLOGSLIST_ASSETS_DIR
from .embeds import render_bloglist_embed
from .tasks import publish_bloglist_embed_on_s3

logger = logging.getLogger('superdesk')


bloglist_blueprint = superdesk.Blueprint('embed_blogslist', __name__, template_folder='templates')
bloglist_assets_blueprint = superdesk.Blueprint('blogslist_assets', __name__, static_folder=BLOGSLIST_ASSETS_DIR)


@bloglist_blueprint.route('/blogslist_embed')
def blogslist_embed(api_host=None, assets_root=None):
    return render_bloglist_embed(api_host=api_host, assets_root=assets_root)


class BlogsListResource(Resource):
    datasource = {
        'source': 'blog_list'
    }
    schema = {
        'key': {'type': 'string', 'required': True, 'unique': True},
        'value': {'type': 'string'}
    }
    RESOURCE_METHODS = ['GET', 'POST', 'PATCH']
    privileges = {'GET': 'generic', 'POST': 'generic',
                  'PATCH': 'generic'}


class BlogsListService(BaseService):
    def publish(self):
        publish_bloglist_embed_on_s3()


@bloglist_blueprint.app_template_filter('tojson')
def tojson(obj):
    #  TODO: remove duplicate template filters.
    return json.dumps(obj, cls=MongoJSONEncoder)
