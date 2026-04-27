"""
Integration tests for LiveBlogTokenAuth.

Tests that token authentication works correctly with the system-level
users service that has NO tenant filtering. Authentication happens before
tenant context exists, so the users service must be able to find users
across all tenants.

These tests use real database operations to verify actual behavior.
"""
from base64 import b64encode
import flask
from unittest.mock import patch

from bson import ObjectId
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.utc import utcnow

from liveblog import tenants, users, auth
from liveblog.common import run_once
from liveblog.auth.token_auth import (
    LiveBlogTokenAuth,
    get_authenticated_user_from_context,
    get_request_auth_token,
    hydrate_request_context_from_token,
)


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

    def test_hydrate_request_context_from_token_populates_flask_g(self):
        tenants_service = get_resource_service("tenants")
        tenant_id = ObjectId(tenants_service.post([{"name": "Hydrate Tenant"}])[0])

        users_service = get_resource_service("users")
        user_id = ObjectId(
            users_service.post(
                [
                    {
                        "username": "hydrate_user",
                        "email": "hydrate@example.com",
                        "password": "testpass123",
                        "first_name": "Hydrate",
                        "last_name": "User",
                        "tenant_id": tenant_id,
                        "user_type": "administrator",
                    }
                ]
            )[0]
        )

        token_value = "test-token-" + str(ObjectId())
        auth_data = {"user": user_id, "token": token_value, "_updated": utcnow()}
        self.app.data.insert("auth", [auth_data])

        with self.app.test_request_context():
            user = hydrate_request_context_from_token(
                token_value, method="POST", touch_session=False
            )

            self.assertEqual(user["_id"], user_id)
            self.assertEqual(flask.g.user["_id"], user_id)
            self.assertEqual(flask.g.auth["token"], token_value)

    def test_hydrate_request_context_from_token_reuses_existing_context(self):
        auth_token = {
            "token": "existing-token",
            "user": ObjectId(),
            "_updated": utcnow(),
        }
        user = {"_id": ObjectId(), "tenant_id": ObjectId(), "username": "existing"}

        with self.app.test_request_context():
            flask.g.auth = auth_token
            flask.g.user = user
            flask.g.auth_session_touched = True

            with patch("liveblog.auth.token_auth.get_resource_service") as mock_grs:
                result = hydrate_request_context_from_token(
                    "existing-token", method="POST", touch_session=True
                )

            self.assertEqual(result, user)
            mock_grs.assert_called_once_with("auth")

    def test_get_authenticated_user_from_context_returns_none_without_user(self):
        with self.app.test_request_context():
            self.assertIsNone(get_authenticated_user_from_context())

    def test_get_authenticated_user_from_context_returns_existing_user(self):
        user = {"_id": ObjectId(), "tenant_id": ObjectId(), "username": "existing"}

        with self.app.test_request_context():
            flask.g.user = user
            self.assertEqual(get_authenticated_user_from_context(), user)

    def test_get_request_auth_token_supports_superdesk_basic_auth_header(self):
        token_value = "test-token-" + str(ObjectId())
        auth_header = "basic " + b64encode((token_value + ":").encode("ascii")).decode(
            "ascii"
        )

        with self.app.test_request_context(headers={"Authorization": auth_header}):
            self.assertEqual(get_request_auth_token(), token_value)

    def test_get_request_auth_token_supports_bearer_header(self):
        token_value = "test-token-" + str(ObjectId())

        with self.app.test_request_context(
            headers={"Authorization": "Bearer " + token_value}
        ):
            self.assertEqual(get_request_auth_token(), token_value)

    def test_hydrate_request_context_from_token_requires_token(self):
        with self.app.test_request_context():
            flask.g.user = {"_id": ObjectId(), "tenant_id": ObjectId()}

            with patch("liveblog.auth.token_auth.get_resource_service") as mock_grs:
                result = hydrate_request_context_from_token(
                    None, method="POST", touch_session=False
                )

            self.assertIsNone(result)
            mock_grs.assert_not_called()
