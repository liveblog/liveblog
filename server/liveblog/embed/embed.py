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

"""Embed module"""
import superdesk
from flask import render_template, json, request, current_app as app
from eve.io.mongo import MongoJSONEncoder
from superdesk import get_resource_service
from liveblog.themes import ASSETS_DIR as THEMES_ASSETS_DIR
import tinys3
import io
import os
import json
import logging

logger = logging.getLogger('superdesk')
THEMES_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'themes'))
bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates')


class AmazonAccessKeyUnknownException(Exception):
    pass


class UnknownTheme(Exception):
    pass


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))


def collect_theme_assets(theme, assets=None, template=None):
    assets = assets or {'scripts': [], 'styles': []}
    # load the template
    if not template:
        template_file_name = os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme['name'], 'template.html')
        if os.path.isfile(template_file_name):
            template = open(template_file_name).read()
    # add assets from parent theme
    if theme.get('extends', None):
        parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
        if parent_theme:
            assets, template = collect_theme_assets(parent_theme, assets, template)
        else:
            error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                % (theme.get('name'), theme.get('extends'))
            logger.info(error_message)
            raise UnknownTheme(error_message)
    # add assets from theme
    for asset_type in ('scripts', 'styles'):
        theme_folder = theme['name']
        assets[asset_type].extend(
            map(lambda url: '%s/%s' % (theme_folder, url) if is_relative_to_current_folder(url) else url,
                theme.get(asset_type) or list())
        )
    return assets, template


def get_default_settings(theme, settings=None):
    settings = settings or {}
    if theme.get('extends', False):
        parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
        if parent_theme:
            settings = get_default_settings(parent_theme, settings)
        else:
            error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                % (theme.get('name'), theme.get('extends'))
            logger.info(error_message)
            raise UnknownTheme(error_message)
    if theme.get('options', False):
        for option in theme.get('options', []):
            settings[option.get('name')] = option.get('default')
    return settings


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
    # retrieve the wanted theme and add it to blog['theme'] if is not the registered one
    try:
        theme_name = request.args.get('theme', theme)
    except RuntimeError:
        # this method can be called outside from a request context
        theme_name = theme
    # if a theme is provided, overwrite the default theme
    if theme_name:
        theme_package = os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme_name, 'theme.json')
        blog['theme'] = json.loads(open(theme_package).read())
    # collect static assets to load them in the template
    try:
        assets, template_file = collect_theme_assets(blog['theme'])
    except UnknownTheme as e:
        return str(e), 500
    # delete assets from theme object
    for asset_type in ('scripts', 'styles'):
        try:
            del blog['theme'][asset_type]
        except KeyError:
            pass
    scope = {
        'blog': blog,
        'settings': get_default_settings(blog.get('theme')),
        'assets': assets,
        'api_host': api_host,
        'template': template_file,
        'assets_root': '/%s/' % ('/'.join((THEMES_ASSETS_DIR, blog['theme']['name'])))
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
