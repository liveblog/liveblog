#!/usr/bin/env python
# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014, 2015 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from superdesk.errors import SuperdeskApiError

"""Embed module"""
import superdesk
from flask import render_template, json, request, current_app as app
from eve.io.mongo import MongoJSONEncoder
from superdesk import get_resource_service
from liveblog.themes import UnknownTheme, ASSETS_DIR as THEMES_ASSETS_DIR
from flask import url_for
import io
import os
import json
import logging

logger = logging.getLogger('superdesk')
THEMES_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'themes'))
bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates')


class MediaStorageUnsupportedForBlogPublishing(Exception):
    pass


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))


def collect_theme_assets(theme, assets_prefix=None, assets=None, template=None):
    assets = assets or {'scripts': [], 'styles': [], 'devScripts': [], 'devStyles': []}
    # load the template
    if not template:
        template_file_name = os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme['name'], 'template.html')
        if os.path.isfile(template_file_name):
            template = open(template_file_name, encoding='utf-8').read()
    # add assets from parent theme
    if theme.get('extends', None):
        parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
        if parent_theme:
            assets, template = collect_theme_assets(parent_theme, assets_prefix, assets=assets, template=template)
        else:
            error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                % (theme.get('name'), theme.get('extends'))
            logger.info(error_message)
            raise UnknownTheme(error_message)
    # add assets from theme
    for asset_type in ('scripts', 'styles', 'devScripts', 'devStyles'):
        theme_folder = theme['name']
        for url in theme.get(asset_type, []):
            if is_relative_to_current_folder(url):
                url = url_for('themes_assets.static', filename=os.path.join(theme_folder, url), _external=False)
                if assets_prefix:
                    url = '/%s%s' % (assets_prefix.strip('/'), url)
            assets[asset_type].append(url)
    return assets, template


def get_file_path(blog_id, theme):
    return 'blogs/%s/%s/index.html' % (blog_id, theme)


def check_media_storage():
    if type(app.media).__name__ is not 'AmazonMediaStorage':
        raise MediaStorageUnsupportedForBlogPublishing()


def publish_embed(blog_id, api_host=None, theme=None):
    html = embed(blog_id, api_host, theme, assets_prefix=app.config.get('S3_THEMES_PREFIX'))
    check_media_storage()
    file_path = get_file_path(blog_id, theme)
    # remove existing
    app.media.delete(file_path)
    # upload
    file_id = app.media.put(io.BytesIO(bytes(html, 'utf-8')),
                            filename=file_path,
                            content_type='text/html')
    return superdesk.upload.url_for_media(file_id)


def delete_embed(blog_id, theme):
    check_media_storage()
    file_path = get_file_path(blog_id, theme)
    # remove existing
    app.media.delete(file_path)


@bp.route('/embed/<blog_id>/<theme>')
def embed(blog_id, theme, api_host=None, assets_prefix=None):
    api_host = api_host or request.url_root
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if not blog:
        return 'blog not found', 404
    # retrieve picture url from relationship
    if blog.get('picture', None):
        blog['picture'] = get_resource_service('archive').find_one(req=None, _id=blog['picture'])
    # retrieve the wanted theme and add it to blog['theme'] if is not the registered one
    try:
        theme_name = request.args.get('theme', theme)
    except RuntimeError:
        # this method can be called outside from a request context
        theme_name = theme
    theme = get_resource_service('themes').find_one(req=None, name=blog['blog_preferences'].get('theme'))
    if theme is None and theme_name is None:
        raise SuperdeskApiError.badRequestError(
            message='You will be able to access the embed after you register the themes')
    # if a theme is provided, overwrite the default theme
    if theme_name:
        theme_package = os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme_name, 'theme.json')
        theme = json.loads(open(theme_package).read())
    try:
        assets, template_file = collect_theme_assets(theme, assets_prefix=assets_prefix)
    except UnknownTheme as e:
        return str(e), 500
    if not template_file:
        logger.error('Template file not found for theme "%s". Theme: %s' % (theme.get('name'), theme))
        return 'Template file not found', 500
    # compute the assets root
    assets_root = [THEMES_ASSETS_DIR, blog['blog_preferences'].get('theme')]
    # prefix the assets root if needed (to isolate s3 bucket for instance)
    if assets_prefix:
        assets_root = [assets_prefix.strip('/')] + assets_root
    assets_root = '/%s/' % ('/'.join(assets_root))
    scope = {
        'blog': blog,
        'settings': get_resource_service('themes').get_default_settings(theme),
        'assets': assets,
        'api_host': api_host,
        'template': template_file,
        'debug': app.config.get('LIVEBLOG_DEBUG'),
        'assets_root': assets_root
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
        'themes': [t[0] for t in themes]
    }
    return render_template('iframe-for-every-themes.html', **scope)


@bp.app_template_filter('tojson')
def tojson(obj):
    return json.dumps(obj, cls=MongoJSONEncoder)


@bp.app_template_filter('is_relative_to_current_folder')
def is_relative_to_current_folder_filter(s):
    return is_relative_to_current_folder(s)

# EOF
