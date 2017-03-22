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
import jinja2
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
import pymongo
from bson import ObjectId


logger = logging.getLogger('superdesk')
THEMES_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'themes'))
bp = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates')


class MediaStorageUnsupportedForBlogPublishing(Exception):
    pass


def is_relative_to_current_folder(url):
    return not (url.startswith('/') or url.startswith('http://') or url.startswith('https://'))


def get_template_file_name(theme):
    return os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme['name'], 'template.html')


def collect_theme_assets(theme, assets=None, template=None):
    assets = assets or {'scripts': [], 'styles': [], 'devScripts': [], 'devStyles': []}
    # load the template
    if not template:
        template_file_name = get_template_file_name(theme)
        if os.path.isfile(template_file_name):
            template = open(template_file_name, encoding='utf-8').read()
    # add assets from parent theme
    if theme.get('extends', None):
        parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
        if parent_theme:
            assets, template = collect_theme_assets(parent_theme, assets=assets, template=template)
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
                if theme.get('public_url', False):
                    url = '%s%s' % (theme.get('public_url'), url)
                else:
                    url = url_for('themes_assets.static', filename=os.path.join(theme_folder, url), _external=False)
            assets[asset_type].append(url)
    return assets, template


def get_file_path(blog_id):
    return 'blogs/%s/index.html' % (blog_id)


def check_media_storage():
    if type(app.media).__name__ is not 'AmazonMediaStorage':
        raise MediaStorageUnsupportedForBlogPublishing()


def publish_embed(blog_id, api_host=None, theme=None):
    html = embed(blog_id, api_host, theme)
    check_media_storage()
    file_path = get_file_path(blog_id)
    # remove existing
    app.media.delete(app.media.media_id(file_path, version=False))
    # upload
    file_id = app.media.put(io.BytesIO(bytes(html, 'utf-8')),
                            filename=file_path,
                            content_type='text/html',
                            version=False)
    return superdesk.upload.url_for_media(file_id)


def delete_embed(blog_id):
    check_media_storage()
    file_path = get_file_path(blog_id)
    # remove existing
    app.media.delete(file_path)


class ThemeTemplateLoader(jinja2.BaseLoader):
    def __init__(self, theme):
        dirname = os.path.dirname(get_template_file_name(theme))
        # TODO: add theme template extensions features.
        self.path = os.path.join(dirname, 'templates')

    def get_source(self, environment, template):
        path = os.path.join(self.path, template)
        if not os.path.exists(path):
            raise jinja2.TemplateNotFound(template)
        mtime = os.path.getmtime(path)
        with open(path) as f:
            source = f.read()
        return source, path, lambda: mtime == os.path.getmtime(path)


class BlogThemeRenderer:
    order_by = ('_updated', '_created')
    default_order_by = '_updated'
    sort = ('asc', 'desc')
    default_sort = 'asc'

    def __init__(self, blog):
        if isinstance(blog, (str, ObjectId)):
            blog = get_resource_service('client_blogs').find_one(_id=blog, req=None)

        self._blog = blog
        self._posts = get_resource_service('client_posts')

    def _validate_order_by(self, order_by):
        if order_by not in self.order_by:
            raise ValueError(order_by)

    def _validate_sort(self, sort):
        if sort not in self.sort:
            raise ValueError(sort)

    def _posts_lookup(self, sticky=None, highlight=None):
        filters = [
            {'blog': {'$eq': self._blog['_id']}},
            {'post_status': {'$eq': 'open'}},
            {'deleted': {'$eq': False}}
        ]
        if sticky:
            filters.append({'sticky': {'$eq': sticky}})
        if highlight:
            filters.append({'highlight': {'$eq': highlight}})
        return {'$and': filters}

    def get_posts(self, sticky=None, highlight=None, order_by=default_order_by, sort=default_sort, page=1, limit=25,
                  wrap=False):
        # Validate parameters.
        self._validate_sort(sort)
        self._validate_order_by(order_by)

        # Fetch total.
        results = self._posts.find(self._posts_lookup(sticky, highlight))
        total = results.count()

        # Get sorting direction.
        if sort == 'asc':
            sort = pymongo.ASCENDING
        else:
            sort = pymongo.DESCENDING

        # Fetch posts, do pagination and sorting.
        skip = limit * (page - 1)
        results = results.skip(skip).limit(limit).sort(order_by, sort)
        posts = []
        for doc in results:
            if 'groups' not in doc:
                continue

            for group in doc['groups']:
                if group['id'] == 'main':
                    for ref in group['refs']:
                        ref['item'] = get_resource_service('archive').find_one(req=None, _id=ref['residRef'])
            posts.append(doc)

        if wrap:
            # Wrap in python-eve style data structure
            return {
                '_items': posts,
                '_meta': {
                    'page': page,
                    'total': total,
                    'max_results': limit
                }
            }
        else:
            # Return posts.
            return posts


@bp.route('/embed/<blog_id>')
def embed(blog_id, api_host=None, theme=None):
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
        assets, template_content = collect_theme_assets(theme)
    except UnknownTheme as e:
        return str(e), 500

    if not template_content:
        logger.error('Template file not found for theme "%s". Theme: %s' % (theme.get('name'), theme))
        return 'Template file not found', 500

    # compute the assets root
    if theme.get('public_url', False):
        assets_root = theme.get('public_url')
    else:
        assets_root = [THEMES_ASSETS_DIR, blog['blog_preferences'].get('theme')]
        assets_root = '/%s/' % ('/'.join(assets_root))

    theme_service = get_resource_service('themes')
    theme_settings = theme_service.get_default_settings(theme)

    api_response = {}
    if theme.get('seoTheme', False):
        # Fetch initial blog posts for SEO theme
        renderer = BlogThemeRenderer(blog)
        api_response = renderer.get_posts(wrap=True)
        embed_template = jinja2.Environment(loader=ThemeTemplateLoader(theme)).from_string(template_content)
        template_content = embed_template.render(
            blog=blog,
            theme=theme,
            api_response=api_response,
            settings=theme_settings,
            options=theme.get('options')
        )

    scope = {
        'blog': blog,
        'theme': theme,
        'settings': theme_settings,
        'assets': assets,
        'api_host': api_host,
        'template_content': template_content,
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
