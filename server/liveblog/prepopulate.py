# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from apps.prepopulate.app_prepopulate import get_default_user, set_logged_user, apply_placeholders
from superdesk import get_resource_service
import superdesk
import os
import json

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


class AppPrepopulateCommand(superdesk.Command):

    option_list = [
        superdesk.Option('--file', '-f', dest='prepopulate_file', default='app_prepopulate_data.json')
    ]


    def run(self, prepopulate_file):
        prepopulate_data(prepopulate_file, get_default_user())

superdesk.command('app:prepopulate', AppPrepopulateCommand())

# EOF
