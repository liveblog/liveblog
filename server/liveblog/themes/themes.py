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
        themes = get_resource_service('themes').get(req=None, lookup={})
        global_default_theme = get_resource_service('global_preferences').get_global_prefs()['theme']
        # raise an exception if the removed theme is the default one
        if deleted_theme['name'] == global_default_theme:
            raise SuperdeskApiError.forbiddenError("This is a default theme and can not be deleted")
        else:
            default_theme = get_resource_service('themes').find_one(req=None, name=global_default_theme)
            extend = default_theme['extends']
            themes_list = []
            # raise an exception if the removed theme is referenced by a default theme
            if deleted_theme['name'] == extend:
                raise SuperdeskApiError.forbiddenError(
                    'This theme is referenced by a default-theme and can not be removed')
            else:
                # raise an exception if the removed theme is part of a default-theme dependency
                for theme in themes:
                    if theme.get('extends'):
                        if deleted_theme['name'] in theme.get('extends'):
                            themes_list.append(theme['name'])
                            if extend in themes_list:
                                raise SuperdeskApiError.forbiddenError(
                                    'This theme is part of default-theme dependency and it can not be removes')
        # update all the blogs using the removed theme and assign the default theme
        blogs_service = get_resource_service('blogs')
        blogs = blogs_service.get(req=None, lookup={'theme._id': deleted_theme['_id']})
        for blog in blogs:
            # will assign the default theme to this blog
            default_theme = blogs_service.get_theme_snapshot(global_default_theme)
            blogs_service.system_update(ObjectId(blog['_id']), {'theme': default_theme}, blog)


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
