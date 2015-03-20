# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


import superdesk
from superdesk import get_backend
from eve.utils import ParsedRequest
from apps.packages.resource import PackageResource
from apps.packages import PackageService


_preferences_key = 'global_preferences'
_general_preferences_key = 'global_settings'


def init_app(app):
    endpoint_name = _preferences_key
    service = GlobalPreferencesService(endpoint_name, backend=get_backend())
    GlobalPreferencesResource(endpoint_name, app=app, service=service)
    superdesk.intrinsic_privilege(resource_name=endpoint_name, method=['PATCH'])


class GlobalPreferencesResource(PackageResource):
    datasource = {
        'default_sort': [('_updated', -1)],
        'projection': {
            _general_preferences_key: 1
        }
    }
    schema = {
        _general_preferences_key: {'type': 'dict', 'required': True}
    }
    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH']


class GlobalPreferencesService(PackageService):
    def get_global_prefs(self):
        return {'language': 'en', 'theme': 'theme1'}

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get(_preferences_key, req=req, lookup=lookup)

# EOF
