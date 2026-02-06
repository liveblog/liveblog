"""
Integration tests for LiveBlogTokenAuth.

Tests that token authentication works correctly with the system-level
users service that has NO tenant filtering. Authentication happens before
tenant context exists, so the users service must be able to find users
across all tenants.

These tests use real database operations to verify actual behavior.
"""
import flask

from bson import ObjectId
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.utc import utcnow

from liveblog import tenants, users, auth
from liveblog.common import run_once
from liveblog.auth.token_auth import LiveBlogTokenAuth


class LiveBlogTokenAuthTestCase(TestCase):
    """Test LiveBlogTokenAuth authentication class."""

    @run_once
    def setup_test_case(self):
        test_config = {
            "LIVEBLOG_DEBUG": True,
            "DEBUG": False,
        }
        self.app.config.update(test_config)

        for lb_app in [tenants, users, auth]:
            lb_app.init_app(self.app)

    def setUp(self):
        super().setUp()
        self.setup_test_case()

    def test_app_uses_liveblog_token_auth(self):
        """Test that self.app.auth is LiveBlogTokenAuth instance."""
        self.assertIsInstance(self.app.auth, LiveBlogTokenAuth)

    def test_check_auth_with_valid_token(self):
        """Test authentication flow with real database and valid token."""
        # Create real tenant
        tenants_service = get_resource_service("tenants")
        tenant_ids = tenants_service.post([{"name": "Test Tenant"}])
        tenant_id = ObjectId(tenant_ids[0])

        # Create real user
        users_service = get_resource_service("users")
        user_data = {
            "username": "testuser_auth",
            "email": "testauth@example.com",
            "password": "testpass123",
            "first_name": "Test",
            "last_name": "User",
            "tenant_id": tenant_id,
            "user_type": "administrator",
        }
        user_ids = users_service.post([user_data])
        user_id = ObjectId(user_ids[0])

        # Create auth token directly in database (bypass service validation)
        token_value = "test-token-" + str(ObjectId())
        auth_data = {"user": user_id, "token": token_value, "_updated": utcnow()}
        self.app.data.insert("auth", [auth_data])

        # Test authentication
        auth = LiveBlogTokenAuth()
        with self.app.test_request_context():
            result = auth.check_auth(token_value, [], "users", "GET")

            # Verify authentication succeeded
            self.assertTrue(result)

            # Verify flask.g is populated correctly
            self.assertEqual(flask.g.user["_id"], user_id)
            self.assertEqual(flask.g.user["tenant_id"], tenant_id)
            self.assertEqual(flask.g.user["username"], "testuser_auth")
            self.assertIsNotNone(flask.g.auth)
            self.assertEqual(flask.g.auth_value, user_id)

    def test_check_auth_with_invalid_token(self):
        """Test authentication fails gracefully with invalid token."""
        auth = LiveBlogTokenAuth()
        with self.app.test_request_context():
            result = auth.check_auth("invalid-token-12345", [], "users", "GET")

            # Verify authentication failed
            self.assertIsNone(result)

            # Verify flask.g.user was not set
            self.assertFalse(hasattr(flask.g, "user"))

    def test_check_auth_works_without_tenant_context(self):
        """
        Test that authentication works before tenant context exists.

        During authentication, flask.g.user doesn't exist yet, so the
        system users service must find users without requiring tenant context.
        This verifies the system service has no tenant filtering.
        """
        # Create tenant A
        tenants_service = get_resource_service("tenants")
        tenant_a_id = ObjectId(tenants_service.post([{"name": "Tenant A"}])[0])

        # Create user in tenant A
        users_service = get_resource_service("users")
        user_data = {
            "username": "user_tenant_a",
            "email": "usera@example.com",
            "password": "testpass123",
            "first_name": "User",
            "last_name": "A",
            "tenant_id": tenant_a_id,
            "user_type": "administrator",
        }
        user_id = ObjectId(users_service.post([user_data])[0])

        # Create auth token directly in database
        token_value = "test-token-" + str(ObjectId())
        auth_data = {"user": user_id, "token": token_value, "_updated": utcnow()}
        self.app.data.insert("auth", [auth_data])

        # Test authentication WITHOUT any tenant context set
        auth = LiveBlogTokenAuth()
        with self.app.test_request_context():
            # Verify no tenant context exists
            self.assertFalse(hasattr(flask.g, "user"))

            # Authenticate - this should work even without tenant context
            result = auth.check_auth(token_value, [], "users", "GET")

            # Verify authentication succeeded
            self.assertTrue(result)
            self.assertEqual(flask.g.user["_id"], user_id)
            self.assertEqual(flask.g.user["tenant_id"], tenant_a_id)
