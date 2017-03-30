# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import io
import logging
import os

import magic
import superdesk
from eve.io.mongo import MongoJSONEncoder
from flask import current_app as app
from flask import json, render_template
from superdesk import get_resource_service
from superdesk.celery_app import celery
from superdesk.resource import Resource
from superdesk.services import BaseService

logger = logging.getLogger('superdesk')
BLOGSLIST_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'blogslist'))
BLOGSLIST_ASSETS_DIR = 'blogslist_assets'
CONTENT_TYPES = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json'
}

bloglist_blueprint = superdesk.Blueprint('embed_blogslist', __name__, template_folder='templates')
bloglist_assets_blueprint = superdesk.Blueprint('blogslist_assets', __name__, static_folder=BLOGSLIST_ASSETS_DIR)
bloglist_assets = {
    'scripts': [
        'vendors/moment/min/moment-with-locales.min.js',
        'vendors/angular/angular.min.js',
        'vendors/angular-resource/angular-resource.min.js',
        'vendors/angular-route/angular-route.min.js',
        'vendors/angular-gettext/dist/angular-gettext.min.js',
        'main.js'
    ],
    'styles': [
        'styles/embed.css',
        'styles/reset.css'
    ],
    'version': 'bower.json'
}


def get_bloglist_file_path():
    return os.path.join(BLOGSLIST_ASSETS_DIR, 'index.html')


@celery.task(soft_time_limit=1800)
def publish_assets(asset_type):
    assets = bloglist_assets.copy()
    # version_path = os.path.join(BLOGSLIST_DIRECTORY, BLOGSLIST_ASSETS_DIR, assets['version'])
    # # loads version json from file
    # version = json.loads(open(version_path, 'rb').read()).get('version', '0.0.0')
    # Save the file in the media storage if needed
    for name in (assets[asset_type]):
        asset_file = os.path.join(BLOGSLIST_DIRECTORY, BLOGSLIST_ASSETS_DIR, name)
        with open(asset_file, 'rb') as file:
            # set the content type
            mime = magic.Magic(mime=True)
            content_type = mime.from_file(asset_file)
            if content_type == 'text/plain' and name.endswith(tuple(CONTENT_TYPES.keys())):
                content_type = CONTENT_TYPES[os.path.splitext(name)[1]]
            final_file_name = os.path.join(BLOGSLIST_ASSETS_DIR, name)
            # remove existing first
            app.media.delete(app.media.media_id(final_file_name,
                                                content_type=content_type,
                                                # version=version
                                                ))
            # upload
            app.media.put(file.read(),
                          filename=final_file_name,
                          content_type=content_type,
                          # version = version
                          )


@celery.task(soft_time_limit=1800)
def publish_bloglist_embed_on_s3():
    # TODO: move to separate task
    if type(app.media).__name__ is not 'AmazonMediaStorage':
        pass
    else:
        assets = bloglist_assets.copy()

        # Publish version file to get the asset_root.
        version_file = os.path.join(BLOGSLIST_ASSETS_DIR, assets.get('version'))

        # Remove existing first.
        app.media.delete(app.media.media_id(version_file, content_type='application/json'))

        # Upload to Amazon S3.
        bloglist_path = os.path.join(BLOGSLIST_DIRECTORY, version_file)
        with open(bloglist_path, 'rb') as f:
            file_id = app.media.put(f.read(), filename=version_file, content_type='application/json')

        assets_public_url = superdesk.upload.url_for_media(file_id)

        # Correct assets public url path.
        assets_public_url = assets_public_url.replace(assets['version'], '')
        assets_public_url = assets_public_url.replace('http://', '//')
        html = render_bloglist_embed(assets_root=assets_public_url)
        file_path = get_bloglist_file_path()

        # Eemove existing.
        app.media.delete(app.media.media_id(file_path, version=False))
        # upload
        file_id = app.media.put(io.BytesIO(bytes(html, 'utf-8')),
                                filename=file_path,
                                content_type='text/html',
                                version=False)
        public_url = superdesk.upload.url_for_media(file_id)

        # Retrieves all opened blogs.
        blogslist_service = get_resource_service('blogslist')
        for blogslist in blogslist_service.get(req=None, lookup=dict(key='bloglist')):
            get_resource_service('blogslist').system_update(blogslist['_id'], {'value': public_url}, blogslist)
        else:
            blogslist_service.create([{'key': 'bloglist', 'value': public_url}])

        # publish_assets('template')
        publish_assets('scripts')
        publish_assets('styles')


def render_bloglist_embed(api_host=None, assets_root=None):
    compiled_api_host = "{}://{}/".format(app.config['URL_PROTOCOL'], app.config['SERVER_NAME'])
    api_host = api_host or compiled_api_host
    assets_root = assets_root or BLOGSLIST_ASSETS_DIR + '/'
    assets = bloglist_assets.copy()

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
    def publish_bloglist_embed_on_s3(self):
        # TODO: check if it is necessary or not.
        publish_bloglist_embed_on_s3()


@bloglist_blueprint.app_template_filter('tojson')
def tojson(obj):
    return json.dumps(obj, cls=MongoJSONEncoder)


class BloglistCommand(superdesk.Command):

    def run(self):
        blogslist_service = get_resource_service('blogslist')
        blogslist_service.publish_bloglist_embed_on_s3()
        print("Bloglist published to s3")


superdesk.command('register_bloglist', BloglistCommand())
