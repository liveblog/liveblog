"""
Test helpers for multi-tenancy tests.

This module provides helper functions to set up tenant-aware test environments.

Usage
-----

For tests that need a tenant and user with tenant_id:

    from liveblog.tests.helpers import setup_tenant_for_test

    class MyTestCase(TestCase):
        def setUp(self):
            # Initialize tenants module
            tenants.init_app(self.app)

            # Create tenant
            tenant_id = setup_tenant_for_test(self.app)

            # Create user with tenant_id
            user_data = {
                "username": "admin",
                "email": "admin@test.com",
                "tenant_id": tenant_id,
            }
            user_ids = self.app.data.insert("users", [user_data])

Or use the convenience function:

    from liveblog.tests.helpers import setup_tenant_and_user

    class MyTestCase(TestCase):
        def setUp(self):
            tenants.init_app(self.app)

            tenant_id, user_ids = setup_tenant_and_user(
                self.app,
                {"username": "admin", "email": "admin@test.com"}
            )
"""

from bson import ObjectId


def setup_tenant_for_test(app, tenant_name="Test Tenant"):
    """
    Create a test tenant for use in tests.

    Args:
        app: Flask application instance with data layer
        tenant_name (str): Name for the test tenant

    Returns:
        ObjectId: The ID of the created tenant

    Example:
        def setUp(self):
            tenant_id = setup_tenant_for_test(self.app)
            self.user_list = [{
                "username": "admin",
                "tenant_id": tenant_id,
                ...
            }]
    """
    tenant_id = ObjectId()
    app.data.insert("tenants", [{"_id": tenant_id, "name": tenant_name}])
    return tenant_id


def create_user_with_tenant(app, tenant_id, user_data):
    """
    Create a user with tenant_id and insert into database.

    Args:
        app: Flask application instance with data layer
        tenant_id (ObjectId): Tenant ID to associate with the user
        user_data (dict): User data (without tenant_id)

    Returns:
        list: List of inserted user IDs

    Example:
        tenant_id = setup_tenant_for_test(self.app)
        user_ids = create_user_with_tenant(
            self.app,
            tenant_id,
            {
                "username": "admin",
                "email": "admin@test.com",
                ...
            }
        )
    """
    user_data["tenant_id"] = tenant_id
    return app.data.insert("users", [user_data])


def setup_tenant_and_user(app, user_data, tenant_name="Test Tenant"):
    """
    Convenience function to create both tenant and user in one call.

    Args:
        app: Flask application instance with data layer
        user_data (dict): User data (without tenant_id)
        tenant_name (str): Name for the test tenant

    Returns:
        tuple: (tenant_id, user_ids)

    Example:
        def setUp(self):
            tenant_id, user_ids = setup_tenant_and_user(
                self.app,
                {
                    "username": "admin",
                    "email": "admin@test.com",
                    "display_name": "Admin User",
                }
            )
    """
    tenant_id = setup_tenant_for_test(app, tenant_name)
    user_ids = create_user_with_tenant(app, tenant_id, user_data)
    return tenant_id, user_ids
