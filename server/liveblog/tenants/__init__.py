"""
Tenants module initialization.

This module registers the tenants resource and service with the Superdesk
application, making it available via the REST API.
"""

import superdesk
from .tenants import TenantsResource, TenantsService


def init_app(app):
    """
    Initialize tenants resource with the application.

    This function is called during application startup to register the
    tenants resource and service. It follows the standard Superdesk
    resource initialization pattern.

    Args:
        app: Flask application instance
    """
    endpoint_name = "tenants"
    service = TenantsService(endpoint_name, backend=superdesk.get_backend())
    TenantsResource(endpoint_name, app=app, service=service)


# Register privileges for tenant management
superdesk.privilege(
    name="tenants_read",
    label="View Tenants",
    description="User can view tenant information",
)

superdesk.privilege(
    name="tenants_manage",
    label="Manage Tenants",
    description="User can create, update, and delete tenants",
)
