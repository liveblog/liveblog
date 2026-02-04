"""
Tenants resource and service for managing multi-tenant workspaces.

This module defines the root resource for multi-tenancy. Tenants are the
top-level isolation boundary - all other resources (blogs, posts, etc.)
belong to a tenant.
"""

from superdesk.resource import Resource
from superdesk.services import BaseService
from .schema import tenants_schema


class TenantsResource(Resource):
    """
    System resource for managing tenants.

    Tenants represent isolated workspaces in LiveBlog. Each tenant has:
    - Complete data isolation from other tenants
    - Their own set of blogs, posts, items, users, etc.
    - Subscription level (solo, team, network)
    - Custom settings

    Note: This resource does NOT inherit tenant filtering (since tenants
    are the root of the tenant hierarchy). Access is typically restricted
    to system administrators only.
    """

    datasource = {"source": "tenants", "search_backend": "elastic"}

    schema = tenants_schema

    mongo_indexes = {"owner_user_id_1": ([("owner_user_id", 1)], {})}

    # Only users with specific privileges can manage tenants
    privileges = {
        "GET": "tenants_read",
        "POST": "tenants_manage",
        "PATCH": "tenants_manage",
        "DELETE": "tenants_manage",
    }

    # There is no reason to expose tenants via the public API
    internal_resource = True


class TenantsService(BaseService):
    """
    Service for tenant management.

    IMPORTANT: This service does NOT inherit from TenantAwareService
    because tenants themselves are the root of tenant hierarchy. Tenants
    don't belong to other tenants - they are the top-level isolation
    boundary.

    This service inherits directly from BaseService to avoid automatic
    tenant filtering.

    Security:
        Access to this service is controlled via privileges (defined in
        TenantsResource). Typically only system administrators should
        have tenants_manage privilege.
    """

    pass


__all__ = ["TenantsResource", "TenantsService"]
