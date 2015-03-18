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
from superdesk import get_resource_service
from .global_preferences import GlobalPreferencesResource, GlobalPreferencesService

_preferences_key = 'liveblog_preferences'
_blog_preferences_key = 'blog_preferences'


def init_app(app):
    endpoint_name = 'blog_preferences'
    service = BlogPreferencesService(endpoint_name, backend=get_backend())
    BlogPreferencesResource(endpoint_name, app=app, service=service)

    superdesk.intrinsic_privilege(resource_name=endpoint_name, method=['PATCH'])


class BlogPreferencesResource(GlobalPreferencesResource):
    datasource = {
        'source': 'global_preferences',
        'projection': {
            _blog_preferences_key: 1
        }
    }
    schema = GlobalPreferencesResource.schema
    schema.update(schema)
    schema.update({
        _blog_preferences_key: {'type': 'dict', 'required': True}
    })

    resource_methods = []
    item_methods = ['GET', 'PATCH']


class BlogPreferencesService(GlobalPreferencesService):

    def set_blog_initial_prefs(self, blog_doc):
        if blog_doc:
            self.set_global_initial_prefs(blog_doc)

    def find_one(self, req, **lookup):
        blogs = get_resource_service('blogs').find_one(req=None, _id=lookup['_id'])
        self.set_global_initial_prefs(blogs)
        return blogs
