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
import json
import logging
import os
import math

import superdesk
from bson.json_util import dumps as bson_dumps
from eve.io.mongo import MongoJSONEncoder
from flask import current_app as app
from flask import json, render_template, request, url_for
from liveblog.themes import UnknownTheme
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from liveblog.blogs.blog import Blog
from liveblog.themes.template.loaders import CompiledThemeTemplateLoader

from .app_settings import BLOGLIST_ASSETS, BLOGSLIST_ASSETS_DIR
from .utils import is_relative_to_current_folder

logger = logging.getLogger('superdesk')
embed_blueprint = superdesk.Blueprint('embed_liveblog', __name__, template_folder='templates')
THEMES_DIRECTORY = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), os.pardir, 'themes'))


def collect_theme_assets(theme, assets=None, template=None, parents=[]):
    theme_name = theme['name']
    themes = get_resource_service('themes')
    is_local_upload = themes.is_uploaded_theme(theme_name) and not themes.is_s3_storage_enabled

    assets = assets or {'scripts': [], 'styles': [], 'devScripts': [], 'devStyles': []}
    # Load the template.
    if not template:
        if themes.is_local_theme(theme_name) or is_local_upload:
            template_file_name = themes.get_theme_template_filename(theme_name)
            if os.path.exists(template_file_name):
                template = open(template_file_name, encoding='utf-8').read()
            else:
                template = theme.get('template')
        else:
            template = theme.get('template')

    # Add assets from parent theme.
    if theme.get('extends') and not theme.get('seoTheme') and \
            theme.get('name') != theme.get('extends') and \
            theme.get('name') not in parents:
        parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
        if parent_theme:
            parents.append(theme.get('extends'))
            assets, template = collect_theme_assets(parent_theme, assets=assets, template=template, parents=parents)
        else:
            error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                % (theme_name, theme.get('extends'))
            logger.info(error_message)
            raise UnknownTheme(error_message)

    # Add assets from theme.
    static_endpoint = 'themes_assets.static'
    if themes.is_uploaded_theme(theme_name):
        static_endpoint = 'themes_uploads.static'

    for asset_type in ('scripts', 'styles', 'devScripts', 'devStyles'):
        theme_folder = theme['name']
        for url in theme.get(asset_type, []):
            if is_relative_to_current_folder(url):
                if theme.get('public_url', False):
                    url = '%s%s' % (theme.get('public_url'), url)
                else:
                    url = url_for(static_endpoint, filename=os.path.join(theme_folder, url), _external=False)
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


def ad_to_post(ad):
    ad["item_type"] = ad["type"]
    post = {"_id": ad["_id"], "post_items_type": "advertisement"}
    post["groups"] = [{"role": "grpRole:NEP", "id": "root", "refs": [{"idRef": "main"}]}]
    post["groups"].append({"role": "grpRole:Main", "id": "main", "refs": [{"item": ad}]})
    return post


@embed_blueprint.route('/embed/<blog_id>', defaults={'theme': None, 'output': None})
@embed_blueprint.route('/embed/<blog_id>/<output>', defaults={'theme': None})
@embed_blueprint.route('/embed/<blog_id>/theme/<theme>', defaults={'output': None})
@embed_blueprint.route('/embed/<blog_id>/<output>/theme/<theme>/')
def embed(blog_id, theme=None, output=None, api_host=None):
    api_host = api_host or request.url_root
    blog = get_resource_service('client_blogs').find_one(req=None, _id=blog_id)
    if not blog:
        return 'blog not found', 404

    # if the `output` is the `_id` get the data.
    if output:
        if isinstance(output, str):
            output = get_resource_service('outputs').find_one(req=None, _id=output)
        if not output:
            return 'output not found', 404
        else:
            collection = get_resource_service('collections').find_one(req=None, _id=output.get('collection'))
            output['collection'] = collection

    # Retrieve picture url from relationship.
    if blog.get('picture', None):
        blog['picture'] = get_resource_service('archive').find_one(req=None, _id=blog['picture'])

    # Retrieve the wanted theme and add it to blog['theme'] if is not the registered one.
    try:
        theme_name = request.args.get('theme', theme)
    except RuntimeError:
        # This method can be called outside from a request context.
        theme_name = theme

    blog_preferences = blog.get('blog_preferences')
    if blog_preferences is None:
        return 'blog preferences are not available', 404

    blog_theme_name = blog_preferences.get('theme')
    if not theme_name:
        # No theme specified. Fallback to theme in blog_preferences.
        theme_name = blog_theme_name

    theme = get_resource_service('themes').find_one(req=None, name=theme_name)
    if theme is None:
        raise SuperdeskApiError.badRequestError(
            message='You will be able to access the embed after you register the themes')

    try:
        assets, template_content = collect_theme_assets(theme)
    except UnknownTheme as e:
        return str(e), 500

    if not template_content:
        logger.error('Template file not found for theme "%s". Theme: %s' % (theme_name, theme))
        return 'Template file not found', 500

    theme_service = get_resource_service('themes')

    # Compute the assets root.
    if theme.get('public_url', False):
        assets_root = theme.get('public_url')
    else:
        assets_root = theme_service.get_theme_assets_url(theme_name)

    theme_settings = theme_service.get_default_settings(theme)
    i18n = theme.get('i18n', {})

    # Check if theme is SEO and/or AMP compatible.
    is_amp = theme.get('ampTheme', False)
    is_seo = theme.get('seoTheme', False)

    if is_seo:
        # Fetch initial blog posts for SEO theme
        blog_instance = Blog(blog)
        page_limit = theme_settings.get('postsPerPage', 10)
        sticky_limit = theme_settings.get('stickyPostsPerPage', 10)
        ordering = theme_settings.get('postOrder', blog_instance.default_ordering)
        posts = blog_instance.posts(wrap=True, limit=page_limit, ordering=ordering, deleted=is_amp)
        sticky_posts = blog_instance.posts(wrap=True, limit=sticky_limit, sticky=True,
                                           ordering='newest_first', deleted=is_amp)

        if output and output.get('collection', False):
            ads = []
            if output['collection'].get('advertisements'):
                for ad in output['collection']['advertisements']:
                    ads.append(get_resource_service('advertisements').find_one(req=None, _id=ad['advertisement_id']))

            pcount = len(posts['_items'])
            acount = len(ads)
            frequency = output["settings"].get("frequency", 4)
            order = output["settings"].get("order", 1)
            if order == 1:
                for i in range(0, pcount, (frequency + 1)):
                    index = math.ceil(i / (frequency + 1)) % acount
                    # transform ad into a valid post.
                    posts['_items'].insert(i, ad_to_post(ads[index]))
            else:
                for i in range(pcount, 0, (frequency + 1)):
                    index = math.floor(i / (frequency + 1)) % acount
                    # transform ad into a valid post.
                    posts['_items'].insert(i, ad_to_post(ads[index]))

        api_response = {
            'posts': posts,
            'stickyPosts': sticky_posts
        }
        embed_env = theme_service.get_theme_template_env(theme, loader=CompiledThemeTemplateLoader)
        embed_template = embed_env.from_string(template_content)
        template_content = embed_template.render(
            blog=blog,
            output=output,
            options=theme,
            json_options=bson_dumps(theme),
            settings=theme_settings,
            api_response=api_response,
            assets_root=assets_root,
            i18n=i18n
        )

    async = theme.get('asyncTheme', False)
    api_host = api_host.replace('//', app.config.get('EMBED_PROTOCOL')) if api_host.startswith('//') else api_host
    api_host = api_host.replace('http://', app.config.get('EMBED_PROTOCOL'))

    scope = {
        'blog': blog,
        'settings': theme_settings,
        'assets': assets,
        'api_host': api_host,
        'output': output,
        'template': template_content,
        'debug': app.config.get('LIVEBLOG_DEBUG'),
        'assets_root': assets_root,
        'async': async,
        'i18n': i18n
    }
    if is_amp:
        # Add AMP compatible css to template context
        styles = theme.get('files', {}).get('styles', {}).values()
        if len(styles):
            scope['amp_style'] = next(iter(styles))

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
        styles = []
        for (key, value) in obj.items():
            if key.lower() == 'background-image':
                value = "url({})".format(value)
            styles.append("{}: {}".format(key, value))
        return ';'.join(styles)
    return ''


@embed_blueprint.app_template_filter('is_relative_to_current_folder')
def is_relative_to_current_folder_filter(s):
    return is_relative_to_current_folder(s)
