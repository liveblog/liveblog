"""
Integration tests for registration blueprint endpoint.

Tests the public /api/register endpoint that allows new users to sign up
and automatically creates a tenant for them.
"""

import json
from unittest.mock import patch, MagicMock
from bson import ObjectId

from superdesk.tests import TestCase
from liveblog.auth.registration import registration_blueprint


class RegistrationEndpointTestCase(TestCase):
    """Test /api/register endpoint."""

    def setUp(self):
        """Set up test fixtures."""
        # Register the blueprint with the test app
        if "registration" not in self.app.blueprints:
            self.app.register_blueprint(registration_blueprint)

        self.client = self.app.test_client()

        self.valid_registration_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }

        self.tenant_id = ObjectId()
        self.user_id = ObjectId()

    @patch("liveblog.auth.registration.RegistrationService")
    def test_successful_registration_returns_201(self, mock_registration_service_class):
        """Test successful registration returns 201 Created with user and tenant info."""
        mock_service = MagicMock()
        mock_service.register_new_user.return_value = {
            "user_id": self.user_id,
            "tenant_id": self.tenant_id,
            "tenant_name": "New User's LiveBlog",
        }
        mock_registration_service_class.return_value = mock_service

        response = self.client.post(
            "/api/register",
            data=json.dumps(self.valid_registration_data),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 201)

        data = json.loads(response.data)
        self.assertEqual(data["_status"], "OK")
        self.assertEqual(data["_id"], str(self.user_id))
        self.assertEqual(data["message"], "Registration successful")
        self.assertEqual(data["user_id"], str(self.user_id))
        self.assertEqual(data["tenant_id"], str(self.tenant_id))
        self.assertIn("tenant_name", data)

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

    @patch("liveblog.auth.registration.RegistrationService")
    def test_duplicate_username_returns_400(self, mock_registration_service_class):
        """Test duplicate username returns 400 with appropriate error."""
        from superdesk.errors import SuperdeskApiError

        mock_service = MagicMock()
        mock_service.register_new_user.side_effect = SuperdeskApiError(
            message="Username already exists", status_code=400
        )
        mock_registration_service_class.return_value = mock_service

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

    @patch("liveblog.auth.registration.RegistrationService")
    def test_internal_error_returns_500(self, mock_registration_service_class):
        """Test internal server error returns 500."""
        mock_service = MagicMock()
        mock_service.register_new_user.side_effect = Exception(
            "Database connection failed"
        )
        mock_registration_service_class.return_value = mock_service

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
        """Test username with underscore is accepted."""
        valid_data = self.valid_registration_data.copy()
        valid_data["username"] = "user_name"

        # We just need to verify it doesn't return 400 for username validation
        # (it might fail at service level, but not at validation)
        with patch(
            "liveblog.auth.registration.RegistrationService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.register_new_user.return_value = {
                "user_id": self.user_id,
                "tenant_id": self.tenant_id,
                "tenant_name": "Test",
            }
            mock_service_class.return_value = mock_service

            response = self.client.post(
                "/api/register",
                data=json.dumps(valid_data),
                content_type="application/json",
            )

            # Should not fail username validation
            self.assertNotEqual(response.status_code, 400)

    def test_valid_username_with_hyphen_accepted(self):
        """Test username with hyphen is accepted."""
        valid_data = self.valid_registration_data.copy()
        valid_data["username"] = "user-name"

        with patch(
            "liveblog.auth.registration.RegistrationService"
        ) as mock_service_class:
            mock_service = MagicMock()
            mock_service.register_new_user.return_value = {
                "user_id": self.user_id,
                "tenant_id": self.tenant_id,
                "tenant_name": "Test",
            }
            mock_service_class.return_value = mock_service

            response = self.client.post(
                "/api/register",
                data=json.dumps(valid_data),
                content_type="application/json",
            )

            # Should not fail username validation
            self.assertNotEqual(response.status_code, 400)
