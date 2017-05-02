# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
import os
import glob
import json
from io import BytesIO
import superdesk
from bson.objectid import ObjectId
from superdesk.errors import SuperdeskApiError
from flask_cors import cross_origin
from eve.io.mongo import MongoJSONEncoder
from flask import request, current_app as app
from superdesk.errors import SuperdeskError
import zipfile
import os
import magic
import logging
from flask import make_response
from settings import (SUBSCRIPTION_LEVEL, SUBSCRIPTION_MAX_THEMES)

logger = logging.getLogger('superdesk')
ASSETS_DIR = 'themes_assets'
CURRENT_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
CONTENT_TYPES = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.svgz': 'image/svg+xml'
}
upload_theme_blueprint = superdesk.Blueprint('upload_theme', __name__)
download_theme_blueprint = superdesk.Blueprint('download_theme', __name__)
themes_assets_blueprint = superdesk.Blueprint('themes_assets', __name__, static_folder=ASSETS_DIR)


class ThemesResource(Resource):

    schema = {
        'name': {
            'type': 'string',
            'unique': True
        },
        'label': {
            'type': 'string'
        },
        'extends': {
            'type': 'string'
        },
        'abstract': {
            'type': 'boolean'
        },
        'version': {
            'type': 'string'
        },
        'screenshot_url': {
            'type': 'string'
        },
        'author': {
            'type': 'string'
        },
        'license': {
            'type': 'string'
        },
        'devStyles': {
            'type': 'list',
            'schema': {
                'type': 'string'
            }
        },
        'devScripts': {
            'type': 'list',
            'schema': {
                'type': 'string'
            }
        },
        'styles': {
            'type': 'list',
            'schema': {
                'type': 'string'
            }
        },
        'scripts': {
            'type': 'list',
            'schema': {
                'type': 'string'
            }
        },
        'options': {
            'type': 'list',
            'schema': {
                'type': 'dict'
            }
        },
        'repository': {
            'type': 'dict'
        },
        'settings': {
            'type': 'dict'
        },
        'public_url': {
            'type': 'string'
        }
    }
    datasource = {
        'source': 'themes',
        'default_sort': [('_updated', -1)]
    }
    additional_lookup = {
        'url': 'regex("[\w\-]+")',
        'field': 'name'
    }
    # point accessible at '/themes/<theme_name>'.
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'global_preferences', 'POST': 'global_preferences',
                  'PATCH': 'global_preferences', 'DELETE': 'global_preferences'}


class UnknownTheme(Exception):
    pass


class ThemesService(BaseService):

    def get_options(self, theme, options=None):
        options = options or []
        if theme.get('extends', False):
            parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
            if parent_theme:
                options = self.get_options(parent_theme, options)
            else:
                error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                    % (theme.get('name'), theme.get('extends'))
                logger.info(error_message)
                raise UnknownTheme(error_message)
        if theme.get('options', False):
            options += theme.get('options')
        return options

    def get_default_settings(self, theme):
        settings = {}
        options = self.get_options(theme)
        for option in options:
            settings[option.get('name')] = option.get('default')
        settings.update(theme.get('settings', {}))
        return settings

    def get_local_themes_packages(self):
        theme_folder = os.path.join(CURRENT_DIRECTORY, ASSETS_DIR)
        for file in glob.glob(theme_folder + '/**/theme.json'):
            files = []
            for root, dirnames, filenames in os.walk(os.path.dirname(file)):
                for filename in filenames:
                    files.append(os.path.join(root, filename))
            yield json.loads(open(file).read()), files

    def update_registered_theme_with_local_files(self, force=False):
        results = {'created': [], 'updated': [], 'unchanged': []}
        for theme, files in self.get_local_themes_packages():
            result = self.save_or_update_theme(theme, files, force_update=force)
            results[result.get('status')].append(result.get('theme'))
        return (results.get('created'), results.get('updated'))

    def save_or_update_theme(self, theme, files=[], force_update=False):
        # Save the file in the media storage if needed
        for name in files:
            with open(name, 'rb') as file:
                if name.endswith('screenshot.png') or type(app.media).__name__ is 'AmazonMediaStorage':
                    # set the content type
                    mime = magic.Magic(mime=True)
                    content_type = mime.from_file(name)
                    if content_type == 'text/plain' and name.endswith(tuple(CONTENT_TYPES.keys())):
                        content_type = CONTENT_TYPES[os.path.splitext(name)[1]]
                    final_file_name = os.path.relpath(name, CURRENT_DIRECTORY)
                    # remove existing first
                    # TO DO: add version parameter to media_id() after merging related core-changes in
                    # amazon_media_storage and desk_media storage
                    # version = theme.get('version', True)
                    app.media.delete(app.media.media_id(final_file_name,
                                                        content_type=content_type
                                                        ))
                    # upload
                    file_id = app.media.put(file.read(),
                                            filename=final_file_name,
                                            content_type=content_type
                                            )
                    # save the screenshot url
                    if name.endswith('screenshot.png'):
                        theme['screenshot_url'] = superdesk.upload.url_for_media(file_id)
                    # theme is needed a theme.json in the root folder.
                    # save the public_url for that theme
                    if name.endswith('theme.json'):
                        theme['public_url'] = superdesk.upload.url_for_media(file_id).replace('theme.json', '')

        previous_theme = self.find_one(req=None, name=theme.get('name'))
        if previous_theme:
            # retrieve the default settings of the current theme
            default_theme_settings = get_resource_service('themes').get_default_settings(theme)
            # retrieve the default settings of the previous theme
            default_prev_theme_settings = get_resource_service('themes').get_default_settings(previous_theme)
            # if there was a customization for the theme settings
            if 'settings' in previous_theme:
                options = []
                old_theme_settings = {}
                # save the existing theme
                old_theme = previous_theme.copy()
                # save the old/existing theme settings
                if old_theme.get('options', False):
                    options += old_theme.get('options')
                for option in options:
                    old_theme_settings[option.get('name')] = option.get('default')
                    old_theme_settings.update(theme.get('old_theme_settings', {}))
                # # initialize the theme settings values for the old theme based on the new settings
                theme_settings = {}
                # loop over theme settings
                for key, value in old_theme_settings.items():
                    # if the settings of previous theme are the same as for the current theme
                    # we keep them in a new variable
                    if value == default_prev_theme_settings[key]:
                        theme_settings[key] = value
                    # otherwise we keep the settings that are already on the theme
                    else:
                        default_theme_settings[key] = default_prev_theme_settings[key]
                theme_settings.update(default_theme_settings)
                # save the new theme settings
                theme['settings'] = theme_settings
            # theme settings at blog level
            blogs_service = get_resource_service('blogs')
            # retrieve the blog that use the previous theme
            blogs = blogs_service.get(req=None, lookup={'blog_preferences.theme': previous_theme['name']})
            # loops over blogs to update settings and keep custom values
            for blog in blogs:
                # initialize the new settings values for the blog based on the new settings
                new_theme_settings = default_theme_settings.copy()
                # loop over blog settings
                for key, value in blog.get('theme_settings', {}).items():
                    # if the values of theme setting from blog level are the same as the settings
                    # from previous theme update the settings we keep them in a new variable
                    if value == default_prev_theme_settings.get(key, None):
                        new_theme_settings[key] = value
                    # otherwise we keep the settings that are already on the blog
                    else:
                        default_theme_settings[key] = value
                new_theme_settings.update(default_theme_settings)
                # save the blog with the new settings
                blogs_service.system_update(ObjectId(blog['_id']),
                                            {'theme_settings': new_theme_settings}, blog)
            if force_update:
                self.replace(previous_theme['_id'], theme, previous_theme)
                blogs_updated = self.publish_related_blogs(theme)
                return dict(status='updated', theme=theme, blogs_updated=blogs_updated)
            else:
                return dict(status='unchanged', theme=theme)
        else:
            self.create([theme])
            return dict(status='created', theme=theme)

    def publish_related_blogs(self, theme):
        from liveblog.blogs.tasks import publish_blog_embed_on_s3
        # FIXME: retrieve only the blogs who use a specified theme
        # terms = []
        # for t in self.get_children(theme['name']) + [theme['name']]:
        #     terms.append({'term': {'blog_preferences.theme': t}})
        blogs = get_resource_service('blogs').get(req=None, lookup={})
        # get all the children for the theme that we modify the settings for
        theme_children = self.get_children(theme.get('name'))
        for blog in blogs:
            blog_pref = blog.get('blog_preferences')
            if blog_pref['theme'] == theme['name']:
                publish_blog_embed_on_s3.delay(str(blog['_id']))
            if theme_children:
                # if a blog has associated the theme that is a  child of the one
                # for which we modify the settings, we redeploy the blog on s3
                for child in theme_children:
                    if blog_pref['theme'] == child:
                        publish_blog_embed_on_s3.delay(str(blog['_id']))
                        break
        return blogs

    def on_create(self, docs):
        subscription = SUBSCRIPTION_LEVEL
        if subscription in SUBSCRIPTION_MAX_THEMES:
            all = self.find()
            if (all.count() + len(docs) > SUBSCRIPTION_MAX_THEMES[subscription]):
                raise SuperdeskApiError.forbiddenError(message='Cannot add another theme.')

    def on_updated(self, updates, original):
        # Republish the related blogs if the settings have been changed
        if 'settings' in updates:
            self.publish_related_blogs(original)

    def on_delete(self, deleted_theme):
        global_default_theme = get_resource_service('global_preferences').get_global_prefs()['theme']
        # raise an exception if the removed theme is the default one
        if deleted_theme['name'] == global_default_theme:
            raise SuperdeskApiError.forbiddenError('This is a default theme and can not be deleted')
        # raise an exception if the removed theme has children
        if self.get(req=None, lookup={'extends': deleted_theme['name']}).count() > 0:
            raise SuperdeskApiError.forbiddenError('This theme has children. It can\'t be removed')
        # update all the blogs using the removed theme and assign the default theme
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup={'blog_preferences.theme': deleted_theme['name']})
        for blog in blogs:
            # will assign the default theme to this blog
            blog['blog_preferences']['theme'] = global_default_theme
            blogs_service.system_update(ObjectId(blog['_id']), {'blog_preferences': blog['blog_preferences']}, blog)

    def get_dependencies(self, theme_name, deps=[]):
        ''' return a list of the dependencies names '''
        deps.append(theme_name)
        theme = self.find_one(req=None, name=theme_name)
        if not theme:
            raise SuperdeskError(400, 'Dependencies are not satisfied')
        if theme and theme.get('extends', False):
            self.get_dependencies(theme.get('extends'), deps)
        return deps

    def get_children(self, theme_name, response=[]):
        for theme in self.get(req=None, lookup={'extends': theme_name}):
            response.append(theme.get('name'))
            self.get_children(theme.get('name'))
        return list(set(response))


@upload_theme_blueprint.route('/theme-download/<theme_name>', methods=['GET'])
@cross_origin()
def download_a_theme(theme_name):
    theme = get_resource_service('themes').find_one(req=None, name=theme_name)
    if not theme:
        error_message = 'Themes: "{}" this theme is not registered.'.format(theme_name)
        logger.info(error_message)
        raise UnknownTheme(error_message)
    theme_filepath = os.path.join(CURRENT_DIRECTORY, ASSETS_DIR, theme_name)
    theme_zip = BytesIO()
    themes_folder = os.path.join(CURRENT_DIRECTORY, ASSETS_DIR)
    # keep the same nameing convention as we have in github.
    zip_folder = 'lb-theme-{}-{}'.format(theme_name, theme.get('version', 'master'))
    with zipfile.ZipFile(theme_zip, 'w') as tz:
        # add all the files from the theme folder
        for root, dirs, files in os.walk(theme_filepath):
            # compile the root for zip.
            zip_root = root.replace(os.path.join(themes_folder, theme_name), zip_folder)
            # add dir itself (needed for empty dirs)
            tz.write(os.path.join(root, "."), os.path.join(zip_root, "."))
            for file in files:
                # compile the path in the zip for the file.
                tz.write(os.path.join(root, file), os.path.join(zip_root, file))

    response = make_response(theme_zip.getvalue(), 200)
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Content-Type'] = 'application/zip'
    response.headers['Content-Disposition'] = 'attachment; filename={}.zip'.format(zip_folder)
    # response.headers['X-Accel-Redirect'] = '{}.zip'.format(zip_folder)
    return response


@upload_theme_blueprint.route('/theme-upload', methods=['POST'])
@cross_origin()
def upload_a_theme():
    themes_service = get_resource_service('themes')
    with zipfile.ZipFile(request.files['media']) as zip_file:
        # Keep only actual files (not folders)
        files = [file for file in zip_file.namelist() if not file.endswith('/')]
        # Determine if there is a root folder
        roots = set(file.split('/')[0] for file in files)
        root_folder = len(roots) == 1 and '%s/' % roots.pop() or ''
        # Check if it has a theme.json in the root folder.
        description_file = next((
            file for file in files if file.lower() == ('%stheme.json' % root_folder)), None)
        if description_file is None:
            return json.dumps(dict(error='A theme needs a theme.json file')), 400
        # decode and load as a json file
        description_file = json.loads(zip_file.read(description_file).decode('utf-8'))
        # check dependencies
        if description_file.get('extends', False):
            try:
                themes_service.get_dependencies(description_file.get('extends'))
            except SuperdeskError as e:
                return json.dumps(dict(error=e.desc)), 400
        # Extract and save files
        extracted_files = []
        for name in files:
            # 1. remove the root folder
            local_filepath = name.replace(root_folder, '', 1)
            # 2. prepend in a root folder called as the theme's name
            local_filepath = os.path.join(CURRENT_DIRECTORY, ASSETS_DIR, description_file.get('name'), local_filepath)
            # 1. create folder if doesn't exist
            os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
            # 2. write the file
            with open(local_filepath, 'wb') as file_in_local_storage:
                file_in_local_storage.write(zip_file.read(name))
                extracted_files.append(local_filepath)
        # Save or update the theme in the database
        result = themes_service.save_or_update_theme(description_file, extracted_files, force_update=True)
        return json.dumps(
            dict(
                _status='OK',
                _action=result.get('status'),
                theme=description_file
            ), cls=MongoJSONEncoder)


class ThemesCommand(superdesk.Command):

    def run(self):
        theme_service = get_resource_service('themes')
        created, updated = theme_service.update_registered_theme_with_local_files(force=True)
        print('%d themes registered' % (len(created) + len(updated)))
        if created:
            print('added:')
            for theme in created:
                print('\t+ %s %s (%s)' % (theme.get('label', theme['name']), theme['version'], theme['name']))
        if updated:
            print('updated:')
            for theme in updated:
                print('theme')
                print('\t* %s %s (%s)' % (theme.get('label', theme['name']), theme['version'], theme['name']))


superdesk.command('register_local_themes', ThemesCommand())
