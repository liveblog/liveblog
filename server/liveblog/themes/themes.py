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
from flask import current_app as app
from superdesk import get_resource_service
import os
import glob
import json
import superdesk


class ThemesResource(Resource):

    schema = {
        'name': {
            'type': 'string'
        },
        'version': {
            'type': 'string'
        },
        'angularModule': {
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
            for file in glob.glob(embed_folder + '/**/package.json'):
                yield json.loads(open(file).read())

    def on_fetched(self, doc):
        # FIXME: for debugging, retrieve themes from filesystem.
        # Useful to don't have to register a theme in order to have it in the list
        if app.config.get('SUPERDESK_TESTING', False):
            doc['_items'] = list(self.get_local_themes_packages())
            return doc

    def update_registered_theme_with_local_files(self):
            for theme in self.get_local_themes_packages():
                previous_theme = self.find_one(req=None, name=theme.get('name'))
                print('coucou', previous_theme)
                if previous_theme:
                    self.replace(previous_theme['_id'], theme, previous_theme)
                else:
                    self.create([theme])


class ThemesCommand(superdesk.Command):

    def run(self):
        theme_service = get_resource_service('themes')
        theme_service.update_registered_theme_with_local_files()


superdesk.command('register', ThemesCommand())
