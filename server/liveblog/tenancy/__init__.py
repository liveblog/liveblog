"""
Multi-tenancy support for LiveBlog.

This module provides tenant context management and utilities for implementing
tenant isolation across the LiveBlog application.
"""

import flask
from superdesk.errors import SuperdeskApiError


def get_tenant_id(required=False):
    """
    Get current tenant ID from authenticated user's JWT claims.

    The tenant_id is extracted from the authenticated user stored in
    flask.g.user, which is populated by Superdesk's authentication
    middleware during request processing.

    Args:
        required (bool): If True, raises Forbidden if no tenant found.
                        If False, returns None when no tenant is available.

    Returns:
        ObjectId or str: tenant_id from flask.g.user
        None: if no user or no tenant_id (when required=False)

    Raises:
        SuperdeskApiError: 403 Forbidden if required=True and no tenant available

    Example:
        tenant_id = get_tenant_id(required=True)
        lookup['tenant_id'] = tenant_id

        tenant_id = get_tenant_id(required=False)
        if tenant_id:
            lookup['tenant_id'] = tenant_id
    """
    user = flask.g.get("user")

    if not user:
        if required:
            raise SuperdeskApiError.forbiddenError(message="Authentication required")
        return None

    if not isinstance(user, dict):
        if required:
            raise SuperdeskApiError.forbiddenError(
                message="User context not fully initialized"
            )
        return None

    tenant_id = user.get("tenant_id")

    if not tenant_id and required:
        raise SuperdeskApiError.forbiddenError(message="User has no tenant assignment")

    return tenant_id


def get_tenant(required=False):
    """
    Get full tenant document from database (cached per-request).

    This function fetches the complete tenant document from the tenants
    collection. The result is cached in flask.g for the duration of the
    request to avoid redundant database queries.

    Args:
        required (bool): If True, raises Forbidden if no tenant found

    Returns:
        dict: Tenant document with _id, name, subscription_level, settings
        None: if no tenant context (when required=False)

    Raises:
        SuperdeskApiError: 403 Forbidden if required=True and no tenant available

    Example:
        tenant = get_tenant(required=True)
        if tenant.get('subscription_level') == 'solo':
            max_blogs = 5
    """
    if hasattr(flask.g, "tenant_cached"):
        tenant = flask.g.tenant_cached
        if not tenant and required:
            raise SuperdeskApiError.forbiddenError(
                message="User has no tenant assignment"
            )
        return tenant

    tenant_id = get_tenant_id(required)
    if not tenant_id:
        return None

    from superdesk import get_resource_service

    tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)

    if not tenant and required:
        raise SuperdeskApiError.forbiddenError(message="Tenant not found")

    flask.g.tenant_cached = tenant
    return tenant


def init_app(app):
    """
    Initialize tenancy resources and services.

    Note: This delegates to liveblog.tenants.init_app() which properly
    registers the tenants resource with TenantsService.
    """
    from liveblog.tenants import init_app as init_tenants_app

    init_tenants_app(app)


__all__ = ["get_tenant_id", "get_tenant", "init_app"]
