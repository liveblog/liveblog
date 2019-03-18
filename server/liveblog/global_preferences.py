# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


import logging
import superdesk
from liveblog.validator import LiveblogValidator
from superdesk import get_backend, get_resource_service
from superdesk.resource import Resource
from superdesk.services import BaseService

_preferences_key = 'global_preferences'
logger = logging.getLogger('superdesk.liveblog.preferences')


def init_app(app):
    endpoint_name = _preferences_key
    service = GlobalPreferencesService(endpoint_name, backend=get_backend())
    GlobalPreferencesResource(endpoint_name, app=app, service=service)
    app.validator = LiveblogValidator


superdesk.privilege(name='global_preferences', label='Global Settings Management',
                    description='User can blobal settings.')


class GlobalPreferencesResource(Resource):
    datasource = {
        'source': _preferences_key
    }
    schema = {
        'key': {'type': 'string', 'required': True, 'unique': True},
        'value': {'type': 'string'}
    }
    privileges = {'GET': 'global_preferences', 'POST': 'global_preferences',
                  'PATCH': 'global_preferences', 'DELETE': 'global_preferences'}


class GlobalPreferencesService(BaseService):

    def save_preference(self, key, data):
        global_prefs = self.get_global_prefs()

        try:
            if key in global_prefs:
                setting = self.get(req=None, lookup={'key': key})[0]
                self.system_update(setting['_id'], {'value': data}, setting)
            else:
                self.post([{'key': key, 'value': data}])
            return True
        except Exception as err:
            logger.error('Unable to save preference {0}. Exception msg: {1}'.format(key, err))
            return False

    def get_global_prefs(self):
        res = get_resource_service(_preferences_key).get(req=None, lookup={})
        return dict([v['key'], v['value']] for v in res if 'value' in v and 'key' in v)

# EOF
