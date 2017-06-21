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

import copy
import jinja2
import json
import logging
import os
import arrow

import superdesk
from bson.json_util import dumps as bson_dumps
from eve.io.mongo import MongoJSONEncoder
from flask import current_app as app
from flask import json, render_template, request, url_for
from liveblog.themes import UnknownTheme
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from liveblog.blogs.blog import Blog

from .app_settings import BLOGLIST_ASSETS, BLOGSLIST_ASSETS_DIR, THEMES_ASSETS_DIR, DEFAULT_THEME_DATE_FORMAT
from .utils import is_relative_to_current_folder, get_template_file_name, get_theme_json

logger = logging.getLogger('superdesk')
embed_blueprint = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates')
THEMES_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'themes'))


class ThemeTemplateLoader(jinja2.BaseLoader):
    """
    Theme template loader for SEO themes.
    """
    def __init__(self, theme):
        theme_dirname = os.path.dirname(get_template_file_name(theme['name']))
        self.paths = [os.path.join(theme_dirname, 'templates')]
        parent_theme = theme.get('extends')
        if parent_theme:
            parent_dirname = os.path.dirname(get_template_file_name(parent_theme))
            self.paths.append(os.path.join(parent_dirname, 'templates'))

    def get_source(self, environment, template):
        for path in self.paths:
            template_path = os.path.join(path, template)
            if not os.path.exists(template_path):
                continue

            mtime = os.path.getmtime(template_path)
            with open(template_path) as f:
                source = f.read()

            return source, path, lambda: mtime == os.path.getmtime(template_path)

        raise jinja2.TemplateNotFound(template_path)


def moment_date_filter(date, format=None):
    """
    Jinja2 filter for moment.js compatible dates.
    :param date:
    :param format:
    :return: str
    """
    parsed = arrow.get(date)
    # Workaround for "x" unsupported format
    if format == 'x':
        return parsed.timestamp
    if not format:
        format = DEFAULT_THEME_DATE_FORMAT
    return parsed.format(format)


def collect_theme_assets(theme, assets=None, template=None):
    assets = assets or {'scripts': [], 'styles': [], 'devScripts': [], 'devStyles': []}
    # Load the template.
    if not template:
        template_file_name = os.path.join(THEMES_DIRECTORY, THEMES_ASSETS_DIR, theme['name'], 'template.html')
        if os.path.isfile(template_file_name):
            template = open(template_file_name, encoding='utf-8').read()

    # Add assets from parent theme.
    if theme.get('extends', None):
        parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
        if parent_theme:
            assets, template = collect_theme_assets(parent_theme, assets=assets, template=template)
        else:
            error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                % (theme.get('name'), theme.get('extends'))
            logger.info(error_message)
            raise UnknownTheme(error_message)

    # Add assets from theme.
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


def render_bloglist_embed(api_host=None, assets_root=None):
    compiled_api_host = "{}://{}/".format(app.config['URL_PROTOCOL'], app.config['SERVER_NAME'])
    api_host = api_host or compiled_api_host
    assets_root = assets_root or BLOGSLIST_ASSETS_DIR + '/'
    assets = copy.deepcopy(BLOGLIST_ASSETS)

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


@embed_blueprint.route('/embed/<blog_id>', defaults={'theme': None, 'output': None})
@embed_blueprint.route('/embed/<blog_id>/<theme>', defaults={'output': None})
@embed_blueprint.route('/embed/<blog_id>')
def embed(blog_id, theme=None, output=None, api_host=None):
    api_host = api_host or request.url_root
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if not blog:
        return 'blog not found', 404

    # if the `output` is the `_id` get the data.
    if output and isinstance(output, str):
        output = get_resource_service('outputs').find_one(req=None, _id=output)
        if not output:
            return 'output not found', 404

    # Retrieve picture url from relationship.
    if blog.get('picture', None):
        blog['picture'] = get_resource_service('archive').find_one(req=None, _id=blog['picture'])

    # Retrieve the wanted theme and add it to blog['theme'] if is not the registered one.
    try:
        theme_name = request.args.get('theme', theme)
    except RuntimeError:
        # This method can be called outside from a request context.
        theme_name = theme

    theme = get_resource_service('themes').find_one(req=None, name=blog['blog_preferences'].get('theme'))
    if theme is None and theme_name is None:
        raise SuperdeskApiError.badRequestError(
            message='You will be able to access the embed after you register the themes')

    # If a theme is provided, overwrite the default theme.
    if theme_name:
        theme = get_theme_json(theme_name)
    else:
        theme_name = theme['name']

    try:
        assets, template_content = collect_theme_assets(theme)
    except UnknownTheme as e:
        return str(e), 500

    if not template_content:
        logger.error('Template file not found for theme "%s". Theme: %s' % (theme_name, theme))
        return 'Template file not found', 500

    # Compute the assets root.
    if theme.get('public_url', False):
        assets_root = theme.get('public_url')
    else:
        assets_root = [THEMES_ASSETS_DIR, blog['blog_preferences'].get('theme')]
        assets_root = '/%s/' % ('/'.join(assets_root))

    theme_service = get_resource_service('themes')
    theme_settings = theme_service.get_default_settings(theme)
    l10n = theme.get('l10n', {})

    # Check if theme is SEO and/or AMP compatible.
    is_amp = theme.get('ampTheme', False)
    is_seo = theme.get('seoTheme', False)

    if is_seo:
        # Fetch initial blog posts for SEO theme
        blog_instance = Blog(blog)
        page_limit = theme_settings.get('postsPerPage', 10)
        sticky_limit = theme_settings.get('stickyPostsPerPage', 10)
        ordering = theme_settings.get('postOrder', blog_instance.default_ordering)
        posts = blog_instance.posts(wrap=True, limit=page_limit, ordering=ordering)
        sticky_posts = blog_instance.posts(wrap=True, limit=sticky_limit, sticky=True)
        api_response = {
            'posts': posts,
            'stickyPosts': sticky_posts
        }
        embed_env = jinja2.Environment(loader=ThemeTemplateLoader(theme))
        embed_env.filters['date'] = moment_date_filter
        embed_template = embed_env.from_string(template_content)
        template_content = embed_template.render(
            blog=blog,
            options=theme,
            json_options=bson_dumps(theme),
            settings=theme_settings,
            api_response=api_response,
            assets_root=assets_root,
            l10n=l10n
        )

    scope = {
        'blog': blog,
        'settings': theme_settings,
        'assets': assets,
        'api_host': api_host,
        'output': output,
        'template': template_content,
        'debug': app.config.get('LIVEBLOG_DEBUG'),
        'assets_root': assets_root,
        'l10n': l10n
    }
    if is_amp:
        # Add AMP compatible css to template context
        amp_inline_css = theme.get('ampThemeInlineCss')
        if amp_inline_css:
            theme_dirname = os.path.dirname(get_template_file_name(theme['name']))
            amp_inline_css_filename = os.path.join(theme_dirname, amp_inline_css)
            if os.path.exists(amp_inline_css_filename):
                with open(amp_inline_css_filename, 'r') as f:
                    scope['amp_style'] = f.read()

    embed_template = 'embed.html'
    if is_amp:
        embed_template = 'embed_amp.html'

    return render_template(embed_template, **scope)


@embed_blueprint.route('/embed/iframe/<blog_id>')
def embed_iframe(blog_id):
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if not blog:
        return 'blog not found', 404
    theme_name = blog['blog_preferences'].get('theme')
    theme_service = get_resource_service('themes')
    theme = theme_service.find_one(req=None, name=theme_name)
    if not theme:
        return 'theme not found', 404
    settings = theme_service.get_default_settings(theme)
    return render_template('embed_iframe.html', blog=blog, theme=theme, settings=settings)


@embed_blueprint.route('/embed/<blog_id>/overview')
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


@embed_blueprint.app_template_filter('tojson')
def tojson(obj):
    return json.dumps(obj, cls=MongoJSONEncoder)


@embed_blueprint.app_template_filter('tostyle')
def tostyle(obj):
    if obj:
        return ','.join(["{}: {}".format(key, value) for (key, value) in obj.items()])
    return ''


@embed_blueprint.app_template_filter('is_relative_to_current_folder')
def is_relative_to_current_folder_filter(s):
    return is_relative_to_current_folder(s)
