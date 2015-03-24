# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from apps.prepopulate.app_prepopulate import set_logged_user, get_default_user, apply_placeholders, \
    PrepopulateResource
from superdesk import get_resource_service
from superdesk.services import BaseService
from superdesk.tests import drop_elastic, drop_mongo
import superdesk
import os
import json


def init_app(app):
    if superdesk.app.config.get('SUPERDESK_TESTING', False):
        endpoint_name = 'prepopulate'
        service = PrepopulateService(endpoint_name, backend=superdesk.get_backend())
        PrepopulateResource(endpoint_name, app=app, service=service)
        superdesk.intrinsic_privilege(resource_name=endpoint_name, method=['POST'])


def get_admin_user():
    user = {'username': 'admin', 'password': 'admin', 'is_active': True, 'needs_activation': False,
            'first_name': 'first name', 'last_name': 'last name'}
    return user


def prepopulate_data(file_name, default_user):
    placeholders = {}
    users = {default_user['username']: default_user['password']}
    default_username = default_user['username']
    file = os.path.join(superdesk.app.config.get('APP_ABSPATH'), 'apps', 'prepopulate', file_name)
    with open(file, 'rt', encoding='utf8') as app_prepopulation:
        json_data = json.load(app_prepopulation)
        for item in json_data:
            service = get_resource_service(item.get('resource', None))
            username = item.get('username', None) or default_username
            set_logged_user(username, users[username])
            id_name = item.get('id_name', None)
            text = json.dumps(item.get('data', None))
            text = apply_placeholders(placeholders, text)
            data = json.loads(text)
            if item.get('resource', None) == 'users':
                users.update({data['username']: data['password']})
            try:
                ids = service.post([data])
                if id_name:
                    placeholders[id_name] = str(ids[0])
            except Exception as e:
                print('Exception:', e)


class PrepopulateService(BaseService):
    def create(self, docs, **kwargs):
        for doc in docs:
            if doc.get('remove_first'):
                drop_elastic(superdesk.app)
                drop_mongo(superdesk.app)
            user = get_resource_service('users').find_one(username=get_default_user()['username'], req=None)
            if not user:
                get_resource_service('users').post([get_default_user()])
            prepopulate_data(doc.get('profile') + '.json', get_default_user())
        return ['OK']


class AppPrepopulateCommand(superdesk.Command):

    option_list = [
        superdesk.Option('--file', '-f', dest='prepopulate_file', default='app_prepopulate_data.json')
    ]

    def run(self, prepopulate_file):
        prepopulate_data(prepopulate_file, get_admin_user())

superdesk.command('app:prepopulate', AppPrepopulateCommand())

# EOF
