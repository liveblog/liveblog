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
from apps.preferences import PreferencesResource, PreferencesService
from eve.utils import ParsedRequest


_preferences_key = 'global_preferences'
_general_preferences_key = 'global_settings'


def init_app(app):
    endpoint_name = 'global_preferences'
    service = GlobalPreferencesService(endpoint_name, backend=get_backend())
    GlobalPreferencesResource(endpoint_name, app=app, service=service)

    superdesk.intrinsic_privilege(resource_name=endpoint_name, method=['PATCH'])


class GlobalPreferencesResource(PreferencesResource):
    datasource = {
        'default_sort': [('_updated', -1)],
        'projection': {
            _general_preferences_key: 1
        }
    }
    schema = PreferencesResource.schema
    schema.update(schema)
    schema.update({
        _general_preferences_key: {'type': 'dict', 'required': True}
    })

    resource_methods = ['GET', 'POST']
    item_methods = ['GET', 'PATCH']

    superdesk.register_default_global_preference('languages:set', {
        'type': 'string',
        'lang': 'en',
        'label': 'Blog language set page'
    })
    superdesk.register_default_global_preference('themes:set', {
        'type': 'string',
        'theme': '',
        'label': 'Blog themes set page'
    })


class GlobalPreferencesService(PreferencesService):

    def set_global_initial_prefs(self, blog_doc):
        if _general_preferences_key not in blog_doc:
            orig_blog_prefs = blog_doc.get(_preferences_key, {})
            available = dict(superdesk.default_global_preferences)
            available.update(orig_blog_prefs)
            blog_doc[_general_preferences_key] = available
        return blog_doc

    def get(self, req, lookup):
        if req is None:
            req = ParsedRequest()
        return self.backend.get('global_preferences', req=req, lookup=lookup)
