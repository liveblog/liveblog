"""
Base test case for tenant-aware services.

Provides utilities for setting user context and managing tenant isolation
in tests.
"""

import flask
from bson import ObjectId
from superdesk.tests import TestCase
from superdesk import get_resource_service


class TenantAwareTestCase(TestCase):
    """
    Base test case for testing tenant-aware services.

    Automatically manages tenant and user context setup, providing a clean
    interface for tests that need to work with tenant-isolated data.

    Usage:
        class MyServiceTestCase(TenantAwareTestCase):
            def setUp(self):
                super().setUp()
                # Tenant and user are already created
                # self.tenant_id and self.user are available

            def test_something(self):
                # flask.g.user is already set
                service = get_resource_service('my_resource')
                service.post([{'title': 'Test'}])
    """

    def tearDown(self):
        self.cleanup_user_context()
        super().tearDown()

    def setup_tenant_and_user(self, tenant_name="Test Tenant", username="testuser"):
        """
        Create default tenant and user for tests.

        Creates a test tenant and user, then sets flask.g.user automatically.
        Call this method after your test has initialized all required modules.

        Args:
            tenant_name (str): Name for the test tenant
            username (str): Username for the test user

        Returns:
            tuple: (tenant_id, user) for convenience

        Example:
            def setUp(self):
                super().setUp()
                # Initialize required modules first
                tenants.init_app(self.app)
                # Then set up tenant context
                self.setup_tenant_and_user()
        """
        tenants_service = get_resource_service("tenants")
        self.tenant_id = tenants_service.post([{"name": tenant_name}])[0]

        self.user = {
            "_id": ObjectId(),
            "username": username,
            "tenant_id": self.tenant_id,
        }

        self.set_user_context(self.user)
        return self.tenant_id, self.user

    def cleanup_user_context(self):
        """Clean up user context after test."""
        if hasattr(flask.g, "user"):
            delattr(flask.g, "user")

    def set_user_context(self, user):
        """
        Set the current user context for tenant-aware operations.

        This method explicitly sets flask.g.user, making it clear that the test
        is operating within a specific user's context. This is required for any
        operations on tenant-aware services.

        Args:
            user (dict): User document with at least _id and tenant_id fields

        Example:
            def test_cross_user_isolation(self):
                # Test as first user
                self.set_user_context(self.user)
                service.post([{'title': 'User 1 item'}])

                # Test as second user in same tenant
                user2 = {'_id': ObjectId(), 'tenant_id': self.tenant_id, 'username': 'user2'}
                self.set_user_context(user2)
                items = service.get(req=None, lookup={})
                # Both users see items from same tenant
        """
        flask.g.user = user


__all__ = ["TenantAwareTestCase"]
