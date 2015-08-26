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
from flask import request, current_app as app
import zipfile
import os


ASSETS_DIR = 'themes_assets'
CURRENT_DIRECTORY = os.path.dirname(os.path.realpath(__file__))
upload_theme_blueprint = superdesk.Blueprint('upload_theme', __name__)
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
        'screenshot': {
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
            embed_folder = os.path.join(os.path.dirname(os.path.realpath(__file__)),
                                        '../', 'embed', 'embed_assets', 'themes')
            for file in glob.glob(embed_folder + '/**/theme.json'):
                yield json.loads(open(file).read())

    def update_registered_theme_with_local_files(self):
        created = []
        updated = []
        for theme in self.get_local_themes_packages():
            previous_theme = self.find_one(req=None, name=theme.get('name'))
            if previous_theme:
                self.replace(previous_theme['_id'], theme, previous_theme)
                updated.append(theme)
            else:
                self.create([theme])
                created.append(theme)
        return (created, updated)

    def on_delete(self, deleted_theme):
        global_default_theme = get_resource_service('global_preferences').get_global_prefs()['theme']
        # raise an exception if the removed theme is the default one
        if deleted_theme['name'] == global_default_theme:
            raise SuperdeskApiError.forbiddenError("This is a default theme and can not be deleted")
        # update all the blogs using the removed theme and assign the default theme
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup={'theme._id': deleted_theme['_id']})
        for blog in blogs:
            # will assign the default theme to this blog
            default_theme = blogs_service.get_theme_snapshot(global_default_theme)
            blogs_service.system_update(ObjectId(blog['_id']), {'theme': default_theme}, blog)


@upload_theme_blueprint.route('/theme-upload', methods=['POST'])
@cross_origin()
def upload_a_theme():
    with zipfile.ZipFile(request.files['media']) as zip_file:
        # Keep only actual files (not folders)
        files = [file for file in zip_file.namelist() if not file.endswith('/')]
        # Check if the package is correct
        try:
            description_file = next((file for file in files if file.endswith('theme.json')))
            # decode and load as a json file
            description_file = json.loads(zip_file.read(description_file).decode('utf-8'))
        except StopIteration:
            return 'A theme needs a theme.json file', 400
        # Extract and save files
        for name in files:
            # Save the file in the media storage is AmazonMediaStorage
            if type(app.media).__name__ is 'AmazonMediaStorage':
                app.media.put(zip_file.read(name), filename=os.path.join(ASSETS_DIR, name), content_type='')
            # Save file in local storage too (for developement)
            local_filepath = os.path.join(CURRENT_DIRECTORY, ASSETS_DIR, name)
            # 1. create folder if doesn't exist
            os.makedirs(os.path.dirname(local_filepath), exist_ok=True)
            # 2. write the file
            with open(local_filepath, 'wb') as file_in_local_storage:
                file_in_local_storage.write(zip_file.read(name))
        # Save the theme in the database
        themes_service = get_resource_service('themes')
        previous_theme = themes_service.find_one(req=None, name=description_file.get('name'))
        if previous_theme:
            themes_service.replace(previous_theme['_id'], description_file, previous_theme)
        else:
            themes_service.create([description_file])
    return 'Ok'


class ThemesCommand(superdesk.Command):

    def run(self):
        theme_service = get_resource_service('themes')
        created, updated = theme_service.update_registered_theme_with_local_files()
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
