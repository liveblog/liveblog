# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
import jinja2
from superdesk.resource import Resource
from superdesk.services import BaseService
from superdesk import get_resource_service
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
from liveblog.mongo_util import encode as mongoencode
from liveblog.system_themes import system_themes

from settings import (COMPILED_TEMPLATES_PATH, UPLOAD_THEMES_DIRECTORY, SUBSCRIPTION_LEVEL, SUBSCRIPTION_MAX_THEMES)
from liveblog.blogs.app_settings import THEMES_ASSETS_DIR, THEMES_UPLOADS_DIR
from .template.filters import moment_date_filter_container, addten, ampify
from .template.loaders import ThemeTemplateLoader


logger = logging.getLogger('superdesk')
CURRENT_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
LOCAL_THEMES_DIRECTORY = os.path.join(CURRENT_DIRECTORY, THEMES_ASSETS_DIR)
CONTENT_TYPES = {
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.svgz': 'image/svg+xml'
}
STEPS = {
    'ampTheme': 2,
    'seoTheme': 2,
    'default': 1
}
upload_theme_blueprint = superdesk.Blueprint('upload_theme', __name__)
download_theme_blueprint = superdesk.Blueprint('download_theme', __name__)
themes_assets_blueprint = superdesk.Blueprint('themes_assets', __name__, static_folder=THEMES_ASSETS_DIR)


class UndefinedVar(jinja2.Undefined):
    def __getattribute__(self, name, *args, **kwargs):

        try:
            return super(UndefinedVar, self).__getattribute__(name, *args, **kwargs)
        except Exception:
            return UndefinedVar()

        return None


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
                'type': 'dict',
                'mapping': {
                    'type': 'object',
                    'enabled': False
                }
            }
        },
        'repository': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            }
        },
        'settings': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            }
        },
        'public_url': {
            'type': 'string'
        },
        'seoTheme': {
            'type': 'boolean',
            'default': False
        },
        'ampTheme': {
            'type': 'boolean',
            'default': False
        },
        'asyncTheme': {
            'type': 'boolean',
            'default': False
        },
        'i18n': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            },
            'default': {}
        },
        'template': {
            'type': 'string',
            'default': ''
        },
        'files': {
            'type': 'dict',
            'mapping': {
                'type': 'object',
                'enabled': False
            }
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
    def get_options(self, theme, options=None, parents=[]):
        """
        Get theme options.

        :param theme:
        :param options:
        :param parents:
        :return:
        """
        options = options or []
        if theme.get('extends', False) and \
                theme.get('name') != theme.get('extends') and \
                theme.get('name') not in parents:
            parent_theme = get_resource_service('themes').find_one(req=None, name=theme.get('extends'))
            if parent_theme:
                parents.append(theme.get('extends'))
                options = self.get_options(parent_theme, options, parents)
            else:
                error_message = 'Embed: "%s" theme depends on "%s" but this theme is not registered.' \
                    % (theme.get('name'), theme.get('extends'))
                logger.info(error_message)
                raise UnknownTheme(error_message)
        if theme.get('options', False):
            options += theme.get('options')
        return options

    def get_default_settings(self, theme):
        """
        Get default theme settings based on theme options.

        :param theme:
        :return:
        """
        settings = {}
        options = self.get_options(theme)
        for option in options:
            settings[option.get('name')] = option.get('default')
        settings.update(theme.get('settings', {}))
        return settings

    def is_local_theme(self, theme_name):
        """
        Check if theme is a default bundled one.

        :param theme_name:
        :return:
        """
        theme_folder = os.path.join(LOCAL_THEMES_DIRECTORY, theme_name)
        return os.path.exists(theme_folder)

    def is_uploaded_theme(self, theme_name):
        """
        Check if theme is user-uploaded.

        :param theme_name:
        :return:
        """
        theme_folder = os.path.join(UPLOAD_THEMES_DIRECTORY, theme_name)
        return os.path.exists(theme_folder)

    def get_theme_path(self, theme_name):
        """
        Get theme template path.

        :param theme_name:
        :return:
        """
        if self.is_local_theme(theme_name):
            template_dir = LOCAL_THEMES_DIRECTORY
        else:
            template_dir = UPLOAD_THEMES_DIRECTORY
        return os.path.join(template_dir, theme_name)

    def get_theme_template_filename(self, theme_name, template_name='template.html'):
        """
        Get main theme template full path.

        :param theme_name:
        :param template_name:
        :return:
        """
        template_path = self.get_theme_path(theme_name)
        return os.path.join(template_path, template_name)

    def get_theme_template_env(self, theme, loader=ThemeTemplateLoader):
        """
        Get jinja2 template environment for SEO themes.

        :param theme:
        :return:
        """
        embed_env = jinja2.Environment(loader=loader(theme), undefined=UndefinedVar)
        embed_env.filters['date'] = moment_date_filter_container(theme)
        embed_env.filters['addten'] = addten
        embed_env.filters['ampify'] = ampify
        return embed_env

    def get_theme_compiled_templates_path(self, theme_name):
        """
        Get jinja2 compiled templates path for SEO themes.

        :param theme_name:
        :return:
        """
        compiled_templates_path = os.path.join(COMPILED_TEMPLATES_PATH, 'themes')
        if not os.path.exists(compiled_templates_path):
            os.makedirs(compiled_templates_path)

        return os.path.join(compiled_templates_path, theme_name)

    @property
    def is_s3_storage_enabled(self):
        # TODO: provide multiple media storage support.
        return type(app.media).__name__ is 'AmazonMediaStorage'

    def get_theme_assets_url(self, theme_name):
        """
        Get assets url for theme.
        :param theme_name:
        :return:
        """

        if self.is_local_theme(theme_name):
            base_assets_dir = THEMES_ASSETS_DIR
        else:
            base_assets_dir = THEMES_UPLOADS_DIR
        return '/{}/'.format('/'.join([base_assets_dir, theme_name]))

    def get_local_themes_packages(self):
        """
        Get local instance theme packages. Includes UPLOAD_THEMES_DIRECTORY if s3 storage is disabled.

        :return:
        """
        if not self.is_s3_storage_enabled:

            # Include upload folder if s3 storage is disabled.
            theme_dirs = [LOCAL_THEMES_DIRECTORY, UPLOAD_THEMES_DIRECTORY]

            for theme_dir in theme_dirs:
                for file in glob.glob(theme_dir + '/**/theme.json'):
                    files = []
                    for root, dirnames, filenames in os.walk(os.path.dirname(file)):
                        for filename in filenames:
                            files.append(os.path.join(root, filename))

                    yield json.loads(open(file).read()), files
        else:
            for theme in system_themes:
                files = []
                for root, dirnames, filenames in os.walk(os.path.join(LOCAL_THEMES_DIRECTORY, theme)):
                    for filename in filenames:
                        files.append(os.path.join(root, filename))
                theme_json = os.path.join(LOCAL_THEMES_DIRECTORY, theme, 'theme.json')
                yield json.loads(open(theme_json).read()), files

    def update_registered_theme_with_local_files(self, force=False):
        """
        Update registered themes with local and uploaded files (if s3 storage is disabled).

        :param force:
        :return:
        """
        results = {'created': [], 'updated': [], 'unchanged': []}

        for theme, files in self.get_local_themes_packages():
            result = self.save_or_update_theme(theme, files, force_update=force)
            results[result.get('status')].append(result.get('theme'))

        return results.get('created'), results.get('updated')

    def _save_theme_file(self, name, theme, upload_path=None):
        theme_name = theme['name']
        if not upload_path:
            upload_path = self.get_theme_path(theme_name)

        with open(name, 'rb') as file:
            # Set the content type
            mime = magic.Magic(mime=True)
            content_type = mime.from_file(name)
            if content_type == 'text/plain' and name.endswith(tuple(CONTENT_TYPES.keys())):
                content_type = CONTENT_TYPES[os.path.splitext(name)[1]]

            final_file_name = os.path.join(theme_name, os.path.relpath(name, upload_path))

            # TODO: Add version parameter to media_id() after merging related core-changes in amazon_media_storage
            # and desk_media storage.
            version = theme.get('version', True)

            # Remove existing file first.
            app.media.delete(app.media.media_id(final_file_name, content_type=content_type))
            # Upload new file.
            file_id = app.media.put(file.read(), filename=final_file_name, content_type=content_type, version=version)

            # Add screenshot_url to theme.
            if name.endswith('screenshot.png'):
                theme['screenshot_url'] = superdesk.upload.url_for_media(file_id)

            # Theme needs a theme.json in the root folder. Save the public_url for that theme.
            if name.endswith('theme.json'):
                theme['public_url'] = superdesk.upload.url_for_media(file_id).replace('theme.json', '')

    def _save_theme_files(self, theme):
        theme_name = theme['name']
        template_path = self.get_theme_template_filename(theme_name)
        if os.path.exists(template_path):
            with open(template_path) as f:
                theme['template'] = f.read()
        else:
            logger.warning("Template file not found for {} theme.".format(theme_name))

        theme['files'] = {'styles': {}, 'scripts': {}, 'templates': {}}

        for root, dirs, templates in os.walk(self.get_theme_template_filename(theme_name, 'templates')):
            for template in templates:
                template_path = self.get_theme_template_filename(theme_name, os.path.join('templates', template))
                if os.path.exists(template_path):
                    with open(template_path) as f:
                        theme['files']['templates'][mongoencode(template)] = f.read()

        for style in theme.get('styles', []):
            style_path = self.get_theme_template_filename(theme_name, style)
            if os.path.exists(style_path):
                with open(style_path) as f:
                    theme['files']['styles'][mongoencode(style)] = f.read()
        if theme.get('seoTheme') or theme.get('ampTheme'):
            template_env = self.get_theme_template_env(theme)
            target = self.get_theme_compiled_templates_path(theme_name)
            try:
                template_env.compile_templates(target, ignore_errors=False)
            except Exception:
                logger.exception("Template files compilation failed for {} theme.")

    def _save_theme_settings(self, theme, previous_theme):
        # Get default settings of current theme.
        default_theme_settings = self.get_default_settings(theme)
        default_prev_theme_settings = self.get_default_settings(previous_theme)

        # Check if theme settings are changed.
        if 'settings' in previous_theme:
            options = []
            old_theme_settings = {}
            old_theme = previous_theme.copy()
            # Save the previous theme settings.
            if old_theme.get('options', False):
                options += old_theme.get('options')

            for option in options:
                old_theme_settings[option.get('name')] = option.get('default')
                old_theme_settings.update(theme.get('old_theme_settings', {}))

            # Initialize the theme settings values for the old theme based on the new settings
            theme_settings = {}
            # loop over theme settings
            for key, value in old_theme_settings.items():
                if value == default_prev_theme_settings[key]:
                    # If settings of previous theme are the same as the current, we keep them in a new variable
                    theme_settings[key] = value
                else:
                    # Otherwise we keep the settings that are already on the theme.
                    default_theme_settings[key] = default_prev_theme_settings[key]

            theme_settings.update(default_theme_settings)
            theme['settings'] = theme_settings

            # Set theme settings for blogs using previous theme.
            blogs_service = get_resource_service('blogs')
            blogs = blogs_service.get(req=None, lookup={'blog_preferences.theme': previous_theme['name']})
            for blog in blogs:
                # Create new settings values for the blog based on uploaded theme settings.
                new_theme_settings = default_theme_settings.copy()
                for key, value in blog.get('theme_settings', {}).items():
                    # If values of theme setting from blog level are the same as previous update the settings.
                    if value == default_prev_theme_settings.get(key, None):
                        new_theme_settings[key] = value
                    # Otherwise we keep the value that is already available.
                    else:
                        default_theme_settings[key] = value

                new_theme_settings.update(default_theme_settings)
                # Save the blog with the new settings
                blogs_service.system_update(ObjectId(blog['_id']), {'theme_settings': new_theme_settings}, blog)

    def save_or_update_theme(self, theme, files=[], force_update=False, keep_files=True, upload_path=None):
        theme_name = theme['name']
        # Save the file in the media storage if needed
        if self.is_s3_storage_enabled:
            for name in files:
                self._save_theme_file(name, theme, upload_path=upload_path)

        # Save theme template and jinja2 compiled templates for SEO themes.
        self._save_theme_files(theme)

        previous_theme = self.find_one(req=None, name=theme_name)
        if previous_theme:
            self._save_theme_settings(theme, previous_theme)
            if force_update:
                self.replace(previous_theme['_id'], theme, previous_theme)
                blogs_updated = self.publish_related_blogs(theme)
                response = dict(status='updated', theme=theme, blogs_updated=blogs_updated)
            else:
                response = dict(status='unchanged', theme=theme)
        else:
            self.create([theme])
            response = dict(status='created', theme=theme)

        is_local_theme = self.is_local_theme(theme_name)
        is_temp_upload = self.is_uploaded_theme(theme_name) and self.is_s3_storage_enabled

        if not keep_files and not is_local_theme or is_temp_upload:
            for filename in files:
                os.unlink(filename)

        return response

    def publish_related_blogs(self, theme):
        from liveblog.blogs.tasks import publish_blog_embed_on_s3
        blogs = get_resource_service('blogs').find({'blog_preferences.theme': theme.get('name')})
        outputs = get_resource_service('outputs').find({'theme': theme.get('name')})
        countdown = 1
        step = STEPS.get('default')
        if theme.get('seoTheme'):
            step = STEPS.get('seoTheme')
        if theme.get('ampTheme'):
            step = STEPS.get('ampTheme')

        for blog in blogs:
            publish_blog_embed_on_s3.apply_async(args=[blog.get('_id')], countdown=countdown)
            countdown += step

        for output in outputs:
            publish_blog_embed_on_s3.apply_async(args=[output.get('blog')],

                                                 kwargs={
                                                     'theme': output.get('theme', None),
                                                     'output': output},
                                                 countdown=countdown)
            countdown += step

        return blogs

    def on_create(self, docs):
        subscription = SUBSCRIPTION_LEVEL
        if subscription in SUBSCRIPTION_MAX_THEMES:
            all = self.find()

            if (all.count() + len(docs) > SUBSCRIPTION_MAX_THEMES[subscription]):
                raise SuperdeskApiError.forbiddenError(message='Cannot add another theme.')

    def on_updated(self, updates, original):
        # Republish the related blogs if the settings have been changed.
        if 'settings' in updates:
            self.publish_related_blogs(original)

    def on_delete(self, deleted_theme):
        global_default_theme = get_resource_service('global_preferences').get_global_prefs()['theme']
        # Raise an exception if the removed theme is the default one.
        if deleted_theme['name'] == global_default_theme:
            raise SuperdeskApiError.forbiddenError('This is a default theme and can not be deleted')

        # Raise an exception if the removed theme has children.
        if self.get(req=None, lookup={'extends': deleted_theme['name']}).count() > 0:
            raise SuperdeskApiError.forbiddenError('This theme has children. It can\'t be removed')

        # Update all the blogs using the removed theme and assign the default theme.
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup={'blog_preferences.theme': deleted_theme['name']})

        for blog in blogs:
            # will assign the default theme to this blog
            blog['blog_preferences']['theme'] = global_default_theme
            blogs_service.system_update(ObjectId(blog['_id']), {'blog_preferences': blog['blog_preferences']}, blog)

    def get_dependencies(self, theme_name, deps=[]):
        """
        Return a list of the dependencies names.

        :param theme_name:
        :param deps:
        :return:
        """
        deps.append(theme_name)
        theme = self.find_one(req=None, name=theme_name)
        if not theme:
            raise SuperdeskError(400, 'Dependencies are not satisfied')

        if theme and theme.get('extends', False):
            self.get_dependencies(theme.get('extends'), deps)

        return deps

    def get_children(self, theme_name, response=[]):
        """
        Return theme childern.

        :param theme_name:
        :param response:
        :return:
        """
        for theme in self.get(req=None, lookup={'extends': theme_name}):
            response.append(theme.get('name'))
            self.get_children(theme.get('name'))

        return list(set(response))


@upload_theme_blueprint.route('/theme-redeploy/<theme_name>', methods=['GET'])
@cross_origin()
def redeploy_a_theme(theme_name):
    themes_service = get_resource_service('themes')
    theme = themes_service.find_one(req=None, name=theme_name)
    if not theme:
        error_message = 'Themes: "{}" this theme is not registered.'.format(theme_name)
        logger.info(error_message)
        raise UnknownTheme(error_message)
    assets = themes_service.get_local_themes_packages()
    theme, files = next((theme, files) for theme, files in assets if theme['name'] == theme_name)
    result = themes_service.save_or_update_theme(theme, files, force_update=True)
    return json.dumps(
        dict(
            _status='OK',
            _action=result.get('status'),
            theme=theme_name
        ), cls=MongoJSONEncoder
    )


@upload_theme_blueprint.route('/theme-download/<theme_name>', methods=['GET'])
@cross_origin()
def download_a_theme(theme_name):
    themes = get_resource_service('themes')
    theme = themes.find_one(req=None, name=theme_name)
    if not theme:
        error_message = 'Themes: "{}" this theme is not registered.'.format(theme_name)
        logger.info(error_message)
        raise UnknownTheme(error_message)

    zip_folder = 'lb-theme-{}-{}'.format(theme_name, theme.get('version', 'master'))

    def _response(theme_filepath):
        theme_zip = BytesIO()
        # keep the same nameing convention as we have in github.
        with zipfile.ZipFile(theme_zip, 'w') as tz:
            # add all the files from the theme folder
            for root, dirs, files in os.walk(theme_filepath):
                # compile the root for zip.
                zip_root = root.replace(theme_filepath, zip_folder)
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

    is_local = themes.is_local_theme(theme_name) or themes.is_uploaded_theme(theme_name)
    if themes.is_s3_storage_enabled and not is_local:
        return 'Theme .zip download is not available!', 404
    else:
        theme_filepath = themes.get_theme_path(theme_name)
        return _response(theme_filepath)


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
        theme_json = next((
            file for file in files if file.lower() == ('%stheme.json' % root_folder)), None)
        if theme_json is None:
            return json.dumps(dict(error='A theme needs a theme.json file')), 400

        # Decode and load as a json file
        theme_json = json.loads(zip_file.read(theme_json).decode('utf-8'))
        theme_name = theme_json.get('name')
        if not theme_name:
            return json.dumps({'error': 'No name specified in theme.json file.'}), 400

        # Check if uploaded theme with the given name already exists.
        if theme_name in system_themes:
            return json.dumps({'error': 'A theme with the given name ({}) already exists!'.format(theme_name)}), 400

        # Check dependencies.
        extends = theme_json.get('extends')
        if extends:
            if extends == theme_name:
                return json.dumps({'error': 'Uploaded theme {} cannot extend itself!'.format(theme_name)}), 400

            if not themes_service.find_one(req=None, name=extends):
                return json.dumps({'error': 'Parent theme ({}) does not exists!'.format(extends)}), 400

            try:
                themes_service.get_dependencies(extends)
            except SuperdeskError as e:
                return json.dumps(dict(error=e.desc)), 400

        # Extract and save files
        upload_path = os.path.join(UPLOAD_THEMES_DIRECTORY, theme_name)
        extracted_files = []
        for name in files:
            # Remove the root folder
            local_filepath = name.replace(root_folder, '', 1)
            # Prepend in a root folder called as the theme's name
            local_filepath = os.path.join(upload_path, local_filepath)
            # Create folder if doesn't exist
            os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
            # Write the file
            with open(local_filepath, 'wb') as file_in_local_storage:
                file_in_local_storage.write(zip_file.read(name))
                extracted_files.append(local_filepath)

        # Save or update the theme in the database
        result = themes_service.save_or_update_theme(theme_json, extracted_files, force_update=True,
                                                     keep_files=not themes_service.is_s3_storage_enabled,
                                                     upload_path=upload_path)

        return json.dumps(
            dict(
                _status='OK',
                _action=result.get('status'),
                theme=theme_json
            ), cls=MongoJSONEncoder
        )
