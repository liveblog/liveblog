# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license
from flask import Blueprint
from flask_cors import CORS
from superdesk.resource import Resource
from superdesk import get_resource_service

from liveblog.utils.api import api_response, api_error
from liveblog.tenancy.service import TenantAwareService
from liveblog.tenancy.context import tenant_context_from_blog

from .utils import get_advertisements_list

advertisements_blueprint = Blueprint("foo", __name__)
CORS(advertisements_blueprint)


class AdvertisementsResource(Resource):
    schema = {
        "name": {"type": "string"},
        "tenant_id": Resource.rel("tenants"),
        "type": {
            "type": "string",
            "allowed": [
                "Advertisement Local",
                "Advertisement Remote",
                "Advertisement Adsense",
            ],
            "default": "Advertisement Local",
        },
        "meta": {
            "type": "dict",
            "mapping": {"type": "object", "enabled": False},
            "nullable": True,
        },
        "text": {"type": "string"},
        "deleted": {"type": "boolean", "default": False},
    }
    datasource = {"source": "advertisements", "default_sort": [("name", 1)]}
    mongo_indexes = {
        "advertisement_name_tenant_unique": (
            [("name", 1), ("tenant_id", 1)],
            {"unique": True},
        ),
    }

    privileges = {
        "GET": "advertisements_read",
        "POST": "advertisements_create",
        "PATCH": "advertisements_update",
        "DELETE": "advertisements_delete",
    }


class AdvertisementsService(TenantAwareService):
    def on_updated(self, updates, original):
        super().on_updated(updates, original)
        collections_service = get_resource_service("collections")

        # deletes advertisement from collection
        if updates.get("deleted", False):
            collections_service.delete_advertisement(original)
        # updates the collections, (caching issues)
        else:
            collections_service.update_advertisement(original)


@advertisements_blueprint.route("/api/advertisements/<blog_id>/<output>/")
def get_advertisements(blog_id, output):
    """
    Returns the list of advertisements for a given output id.
    Used by the default theme's client-side ads-manager.js for ad refresh.

    Args:
        :blog_id: string
        :output: string of the desired output channel
    """
    blog = get_resource_service("client_blogs").find_one(req=None, _id=blog_id)
    if not blog:
        return api_error("blog not found", 404)

    with tenant_context_from_blog(blog):
        if output:
            if isinstance(output, str):
                output = get_resource_service("outputs").find_one(req=None, _id=output)
            if not output:
                return api_error("output not found", 404)
            collection = get_resource_service("collections").find_one(
                req=None, _id=output.get("collection")
            )
            output["collection"] = collection

        ads = get_advertisements_list(output)

    return api_response(ads, 200)
