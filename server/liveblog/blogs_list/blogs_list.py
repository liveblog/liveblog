# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import superdesk
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
from flask import render_template, json, request, current_app as app
import os
from eve.io.mongo import MongoJSONEncoder

BLOGS_LIST_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'blogs_list'))
BLOGS_LIST_ASSETS_DIR = 'blogslist_assets'
bp = superdesk.Blueprint('embed_blogs_list', __name__, template_folder='templates')
bloglist_assets_blueprint = superdesk.Blueprint('blogslist_assets', __name__, static_folder=BLOGS_LIST_ASSETS_DIR)

def publish_bloglist_embed_on_s3():
    pass

@bp.route('/blogslist_embed')
def blogs_list_embed(api_host=None):
    api_host = api_host or request.url_root

    # # compute the assets root
    # if theme.get('public_url', False):
    #     assets_root = theme.get('public_url')
    # else:
    #     assets_root = [THEMES_ASSETS_DIR, blog['blog_preferences'].get('theme')]
    #     assets_root = '/%s/' % ('/'.join(assets_root))

    # template_file_name = os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme['name'], 'template.html')
    # if os.path.isfile(template_file_name):
    #     template = open(template_file_name, encoding='utf-8').read()

    scope = {
        'debug': app.config.get('LIVEBLOG_DEBUG'),
        'api_host': api_host,
        'assets': {
            'scripts': [
                '/blogslist_assets/vendors/moment/min/moment-with-locales.min.js',
                '/blogslist_assets/vendors/angular/angular.min.js',
                '/blogslist_assets/vendors/angular-resource/angular-resource.min.js',
                '/blogslist_assets/vendors/angular-route/angular-route.min.js',
                '/blogslist_assets/vendors/angular-gettext/dist/angular-gettext.min.js',
                '/blogslist_assets/main.js'
            ],
            'styles': [
                '/blogslist_assets/styles/embed.css',
                '/blogslist_assets/styles/reset.css'
            ]
        },
        'assets_root': BLOGS_LIST_ASSETS_DIR
    }
    return render_template('blog-list-embed.html', **scope)


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
    pass

@bp.app_template_filter('tojson')
def tojson(obj):
    return json.dumps(obj, cls=MongoJSONEncoder)
