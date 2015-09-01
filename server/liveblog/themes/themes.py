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
import superdesk
from bson.objectid import ObjectId
from superdesk.errors import SuperdeskApiError
from flask.ext.cors import cross_origin
from eve.io.mongo import MongoJSONEncoder
from flask import request, current_app as app
from superdesk.errors import SuperdeskError
import zipfile
import os
import magic


ASSETS_DIR = 'themes_assets'
CURRENT_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
upload_theme_blueprint = superdesk.Blueprint('upload_theme', __name__)
themes_assets_blueprint = superdesk.Blueprint('themes_assets', __name__, static_folder=ASSETS_DIR)
mime = magic.Magic(mime=True)


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
        'files': {
            'type': 'list'
        }
    }
    datasource = {
        'source': 'themes',
        'default_sort': [('_updated', -1)]
    }
    ITEM_METHODS = ['GET', 'POST', 'DELETE']
    privileges = {'GET': 'global_preferences', 'POST': 'global_preferences',
                  'PATCH': 'global_preferences', 'DELETE': 'global_preferences'}


class ThemesService(BaseService):

    def get_local_themes_packages(self):
        theme_folder = os.path.join(CURRENT_DIRECTORY, ASSETS_DIR)
        for file in glob.glob(theme_folder + '/**/theme.json'):
            files = []
            for root, dirnames, filenames in os.walk(os.path.dirname(file)):
                for filename in filenames:
                    files.append(os.path.join(root, filename))
            yield json.loads(open(file).read()), files

    def update_registered_theme_with_local_files(self, force=False):
        results = {'created': [], 'updated': []}
        for theme, files in self.get_local_themes_packages():
            result = self.save_or_update_theme(theme, files, force_update=force)
            results[result.get('status')].append(result.get('theme'))
        return (results.get('created'), results.get('updated'))

    def save_or_update_theme(self, theme, files=[], force_update=False):
        # Save the file in the media storage if needed
        for name in files:
            with open(name, 'rb') as file:
                if name.endswith('screenshot.png') or type(app.media).__name__ is 'AmazonMediaStorage':
                    content_type = mime.from_file(name).decode('utf8')
                    final_file_name = os.path.relpath(name, CURRENT_DIRECTORY)
                    file_id = app.media.put(file.read(), filename=final_file_name, content_type=content_type)
                    # save the screenshot url
                    if name.endswith('screenshot.png'):
                        theme['screenshot_url'] = superdesk.upload.url_for_media(file_id)
        previous_theme = self.find_one(req=None, name=theme.get('name'))
        if previous_theme:
            if force_update:
                self.replace(previous_theme['_id'], theme, previous_theme)
                return dict(status='updated', theme=theme)
            else:
                return dict(status='unchanged', theme=theme)
        else:
            self.create([theme])
            return dict(status='created', theme=theme)

    def on_delete(self, deleted_theme):
        # themes = get_resource_service('themes').get(req=None, lookup={})
        global_default_theme = get_resource_service('global_preferences').get_global_prefs()['theme']
        # raise an exception if the removed theme is the default one
        if deleted_theme['name'] == global_default_theme:
            raise SuperdeskApiError.forbiddenError('This is a default theme and can not be deleted')
        # raise an exception if the removed theme has children
        if self.get(req=None, lookup={'extends': deleted_theme['name']}).count() > 0:
            raise SuperdeskApiError.forbiddenError('This theme has children. It can\'t be removed')
        # update all the blogs using the removed theme and assign the default theme
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup={'theme._id': deleted_theme['_id']})
        for blog in blogs:
            # will assign the default theme to this blog
            default_theme = blogs_service.get_theme_snapshot(global_default_theme)
            blogs_service.system_update(ObjectId(blog['_id']), {'theme': default_theme}, blog)

    def get_dependencies(self, theme_name, deps=[]):
        ''' return a list of the dependencies names '''
        deps.append(theme_name)
        theme = self.find_one(req=None, name=theme_name)
        if not theme:
            raise SuperdeskError(400, 'Dependencies are not satisfied')
        if theme and theme.get('extends', False):
            self.get_dependencies(theme.get('extends'), deps)
        return deps


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
        # Check if the package is correct
        try:
            description_file = next((file for file in files if file.endswith('theme.json')))
            # decode and load as a json file
            description_file = json.loads(zip_file.read(description_file).decode('utf-8'))
        except StopIteration:
            return json.dumps(dict(error='A theme needs a theme.json file')), 400
        # check dependencies
        try:
            themes_service.get_dependencies(description_file.get('extends', None))
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
        return json.dumps(dict(status=result.get('status'), theme=description_file), cls=MongoJSONEncoder)


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
                print('\t* %s %s (%s)' % (theme.get('label', theme['name']), theme['version'], theme['name']))


superdesk.command('register_local_themes', ThemesCommand())
