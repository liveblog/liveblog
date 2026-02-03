"""
Integration tests for registration blueprint endpoint.

Tests the public /api/register endpoint that allows new users to sign up
and automatically creates a tenant for them using real HTTP → Service → DB flow.
"""

import json
import uuid
from bson import ObjectId

from superdesk.tests import TestCase
from superdesk import get_resource_service
from liveblog.auth.registration import registration_blueprint
from liveblog import tenants, users
from liveblog.common import run_once


class RegistrationEndpointTestCase(TestCase):
    """Test /api/register endpoint."""

    @run_once
    def setup_test_case(self):
        test_config = {
            "LIVEBLOG_DEBUG": True,
            "DEBUG": False,
        }
        self.app.config.update(test_config)

        # Initialize required modules
        for lb_app in [tenants, users]:
            lb_app.init_app(self.app)

        # Register the blueprint with the test app
        if "registration" not in self.app.blueprints:
            self.app.register_blueprint(registration_blueprint)

    def setUp(self):
        """Set up test fixtures."""
        super().setUp()
        self.setup_test_case()

        self.client = self.app.test_client()

        # Use unique identifiers to avoid test conflicts
        unique_id = str(uuid.uuid4())[:8]
        self.valid_registration_data = {
            "username": f"newuser_{unique_id}",
            "email": f"newuser_{unique_id}@example.com",
            "password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }

    def test_successful_registration_returns_201(self):
        """Test successful registration returns 201 Created with real user and tenant in database."""
        response = self.client.post(
            "/api/register",
            data=json.dumps(self.valid_registration_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "OK")
        self.assertEqual(data["message"], "Registration successful")
        self.assertIn("user_id", data)
        self.assertIn("tenant_id", data)
        self.assertIn("tenant_name", data)

        # Verify user was created in database
        users_service = get_resource_service("users")
        user = users_service.system_find_one(req=None, _id=data["user_id"])
        self.assertIsNotNone(user)
        self.assertEqual(user["username"], self.valid_registration_data["username"])
        self.assertEqual(user["email"], self.valid_registration_data["email"])
        self.assertEqual(user["user_type"], "administrator")

        # Verify tenant was created in database
        tenants_service = get_resource_service("tenants")
        tenant = tenants_service.find_one(req=None, _id=ObjectId(data["tenant_id"]))
        self.assertIsNotNone(tenant)
        self.assertEqual(tenant["subscription_level"], "solo")
        self.assertEqual(tenant["owner_user_id"], ObjectId(data["user_id"]))

    def test_missing_username_returns_400(self):
        """Test missing username field returns 400 Bad Request."""
        invalid_data = self.valid_registration_data.copy()
        del invalid_data["username"]

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("username", data["_error"].lower())

    def test_missing_email_returns_400(self):
        """Test missing email field returns 400 Bad Request."""
        invalid_data = self.valid_registration_data.copy()
        del invalid_data["email"]

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("email", data["_error"].lower())

    def test_missing_password_returns_400(self):
        """Test missing password field returns 400 Bad Request."""
        invalid_data = self.valid_registration_data.copy()
        del invalid_data["password"]

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("password", data["_error"].lower())

    def test_short_password_returns_400(self):
        """Test password shorter than 6 characters returns 400."""
        invalid_data = self.valid_registration_data.copy()
        invalid_data["password"] = "12345"

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("6 characters", data["_error"].lower())

    def test_invalid_email_format_returns_400(self):
        """Test invalid email format returns 400."""
        invalid_data = self.valid_registration_data.copy()
        invalid_data["email"] = "not-an-email"

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("email", data["_error"].lower())

    def test_short_username_returns_400(self):
        """Test username shorter than 3 characters returns 400."""
        invalid_data = self.valid_registration_data.copy()
        invalid_data["username"] = "ab"

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("3 characters", data["_error"].lower())

    def test_invalid_username_characters_returns_400(self):
        """Test username with invalid characters returns 400."""
        invalid_data = self.valid_registration_data.copy()
        invalid_data["username"] = "user@name!"

        response = self.client.post(
            "/api/register",
            data=json.dumps(invalid_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("letters", data["_error"].lower())

    def test_duplicate_username_returns_400(self):
        """Test duplicate username returns 400 with appropriate error."""
        # Create a real user first
        users_service = get_resource_service("users")
        tenants_service = get_resource_service("tenants")

        # Create tenant for existing user
        existing_tenant_id = ObjectId(
            tenants_service.post([{"name": "Existing Tenant"}])[0]
        )

        # Create existing user with same username
        existing_user_data = {
            "username": self.valid_registration_data["username"],
            "email": "different@example.com",
            "password": "password123",
            "first_name": "Existing",
            "last_name": "User",
            "tenant_id": existing_tenant_id,
        }
        users_service.post([existing_user_data])

        # Try to register with duplicate username
        response = self.client.post(
            "/api/register",
            data=json.dumps(self.valid_registration_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 400)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("already exists", data["_error"].lower())

    def test_internal_error_returns_500(self):
        """Test internal server error returns 500 when unexpected errors occur."""
        from unittest.mock import patch, MagicMock

        # Use minimal mocking to simulate an unexpected error during tenant creation
        with patch(
            "liveblog.tenancy.registration.get_resource_service"
        ) as mock_get_service:

            def get_service_side_effect(resource_name):
                if resource_name == "tenants":
                    mock_tenants = MagicMock()
                    mock_tenants.post.side_effect = Exception(
                        "Database connection failed"
                    )
                    return mock_tenants
                return get_resource_service(resource_name)

            mock_get_service.side_effect = get_service_side_effect

            response = self.client.post(
                "/api/register",
                data=json.dumps(self.valid_registration_data),
                content_type="application/json",
            )

        self.assertEqual(response.status_code, 500)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "ERR")
        self.assertIn("_error", data)
        self.assertIn("internal server error", data["_error"].lower())

    def test_valid_username_with_underscore_accepted(self):
        """Test username with underscore is accepted and creates user in database."""
        valid_data = self.valid_registration_data.copy()
        valid_data["username"] = f"user_name_{uuid.uuid4().hex[:8]}"
        valid_data["email"] = f"user_name_{uuid.uuid4().hex[:8]}@example.com"

        response = self.client.post(
            "/api/register",
            data=json.dumps(valid_data),
            content_type="application/json",
        )

        # Should succeed (201) not fail validation (400)
        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "OK")

        # Verify user was created with underscore in username
        users_service = get_resource_service("users")
        user = users_service.system_find_one(req=None, _id=data["user_id"])
        self.assertIsNotNone(user)
        self.assertIn("_", user["username"])

    def test_valid_username_with_hyphen_accepted(self):
        """Test username with hyphen is accepted and creates user in database."""
        valid_data = self.valid_registration_data.copy()
        valid_data["username"] = f"user-name-{uuid.uuid4().hex[:8]}"
        valid_data["email"] = f"user-name-{uuid.uuid4().hex[:8]}@example.com"

        response = self.client.post(
            "/api/register",
            data=json.dumps(valid_data),
            content_type="application/json",
        )

        # Should succeed (201) not fail validation (400)
        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "OK")

        # Verify user was created with hyphen in username
        users_service = get_resource_service("users")
        user = users_service.system_find_one(req=None, _id=data["user_id"])
        self.assertIsNotNone(user)
        self.assertIn("-", user["username"])
