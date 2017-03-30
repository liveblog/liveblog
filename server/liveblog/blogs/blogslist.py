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
import os

import superdesk
from eve.io.mongo import MongoJSONEncoder
from flask import current_app as app
from flask import json, render_template
from superdesk.resource import Resource
from superdesk.services import BaseService

from .app_settings import BLOGLIST_ASSETS, BLOGSLIST_ASSETS_DIR
from .tasks import publish_bloglist_embed_on_s3

logger = logging.getLogger('superdesk')


bloglist_blueprint = superdesk.Blueprint('embed_blogslist', __name__, template_folder='templates')
bloglist_assets_blueprint = superdesk.Blueprint('blogslist_assets', __name__, static_folder=BLOGSLIST_ASSETS_DIR)


def render_bloglist_embed(api_host=None, assets_root=None):
    compiled_api_host = "{}://{}/".format(app.config['URL_PROTOCOL'], app.config['SERVER_NAME'])
    api_host = api_host or compiled_api_host
    assets_root = assets_root or BLOGSLIST_ASSETS_DIR + '/'
    assets = BLOGLIST_ASSETS.copy()

    # Compute path relative to the assets_root for `styles` and `scripts`.
    for index, script in enumerate(assets.get('scripts')):
        assets['scripts'][index] = os.path.join(assets_root, script)
    for index, style in enumerate(assets.get('styles')):
        assets['styles'][index] = os.path.join(assets_root, style)

    scope = {
        'debug': app.config.get('LIVEBLOG_DEBUG'),
        'api_host': api_host,
        'assets': assets,
        'assets_root': assets_root
    }
    return render_template('blog-list-embed.html', **scope)


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
