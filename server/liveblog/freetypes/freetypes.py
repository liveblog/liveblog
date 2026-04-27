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
from liveblog.tenancy.service import TenantAwareService


class FreetypesResource(Resource):
    schema = {
        "name": {"type": "string"},
        "template": {"type": "string", "htmloutput": {"template_vars_required": True}},
        "tenant_id": Resource.rel("tenants"),
    }
    datasource = {"source": "freetypes", "default_sort": [("name", 1)]}
    resource_methods = ["GET", "POST"]
    item_methods = ["GET", "PATCH", "DELETE"]

    privileges = {
        "GET": "freetypes_read",
        "POST": "freetypes_create",
        "PATCH": "freetypes_update",
        "DELETE": "freetypes_delete",
    }


class FreetypesService(TenantAwareService):
    def register_freetype_files(self, template, name):
        freetype = {"name": name, "template": template}
        previous = self.find_one(req=None, name=name)

        if previous:
            self.replace(previous["_id"], freetype, previous)
        else:
            self.create([freetype])
