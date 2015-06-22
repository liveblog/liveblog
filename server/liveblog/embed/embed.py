# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

"""Embed module"""
import superdesk
from flask import render_template, json, request, current_app as app
from superdesk import get_resource_service
import tinys3
import io
import os
import json


ASSETS_DIR = 'embed_assets'
bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates', static_folder=ASSETS_DIR)


class AmazonAccessKeyUnknownException(Exception):
    pass


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))


def publish_embed(blog_id, api_host=None, theme=None):
    html = embed(blog_id, api_host, theme)
    if not app.config['AMAZON_ACCESS_KEY_ID']:
        raise AmazonAccessKeyUnknownException()
    region = app.config['AMAZON_REGION']
    bucket = app.config['AMAZON_CONTAINER_NAME']
    s3 = tinys3.Connection(
        app.config['AMAZON_ACCESS_KEY_ID'],
        app.config['AMAZON_SECRET_ACCESS_KEY'],
        default_bucket=bucket,
        endpoint='s3-%s.amazonaws.com' % (region))
    # Uploading a single file
    response = s3.upload('blogs/%s/index.html' % (blog_id), io.BytesIO(bytes(html, 'utf-8')))
    return response.url.replace('s3-%s.amazonaws.com/%s' % (region, bucket),
                                '%s.s3-%s.amazonaws.com' % (bucket, region))


@bp.route('/embed/<blog_id>')
def embed(blog_id, api_host=None, theme=None):
    api_host = api_host or request.url_root
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if not blog:
        return 'blog not found', 404
    theme_name = theme
    try:
        theme_name = theme_name or request.args.get('theme', None)
    except RuntimeError:
        # this method can be called outside from a request context
        pass
    theme_name = theme_name or blog['theme']['name']
    theme_package = '%s/%s/themes/%s/package.json' % \
                    (os.path.dirname(os.path.realpath(__file__)), ASSETS_DIR, theme_name)
    theme = json.loads(open(theme_package).read())
    blog['theme'] = theme
    # complete the urls from `scripts` and `styles` fields when it's relative
    theme_root = 'themes/' + blog['theme']['name']
    for asset_type in ('scripts', 'styles'):
        blog['theme'][asset_type] = list(
            map(lambda url: '%s/%s' % (theme_root, url) if is_relative_to_current_folder(url) else url,
                blog['theme'].get(asset_type) or list())
        )
    scope = {
        'blog': blog,
        'api_host': api_host,
        'assets_root': '/%s/%s/' % (ASSETS_DIR, theme_root)
    }
    return render_template('embed.html', **scope)


@bp.route('/embed/<blog_id>/overview')
def embed_overview(blog_id, api_host=None):
    ''' Show a theme with all the available themes in different iframes '''
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    themes = get_resource_service('themes').get_local_themes_packages()
    blog['_id'] = str(blog['_id'])
    scope = {
        'blog': blog,
        'themes': themes
    }
    return render_template('iframe-for-every-themes.html', **scope)


class JSONEncoder(json.JSONEncoder):
    def default(self, o):
        if type(o).__name__ == 'ObjectId':
            return str(o)
        if hasattr(o, 'isoformat'):
            return o.isoformat()
        return json.JSONEncoder.default(self, o)


@bp.app_template_filter('tojson')
def tojson(obj):
    return json.dumps(obj, cls=JSONEncoder)


@bp.app_template_filter('is_relative_to_current_folder')
def is_relative_to_current_folder_filter(s):
    return is_relative_to_current_folder(s)

# EOF
