"""
Unit tests for RegistrationService.

Tests the user registration service that automatically creates tenants
and handles rollback on failures.
"""

from bson import ObjectId
from unittest.mock import patch, MagicMock

from superdesk.tests import TestCase
from superdesk.errors import SuperdeskApiError
from liveblog.tenancy.registration import RegistrationService


class RegistrationServiceTestCase(TestCase):
    """Test RegistrationService user registration logic."""

    def setUp(self):
        """Set up test fixtures."""
        self.registration_service = RegistrationService()

        self.valid_user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }

        self.tenant_id = ObjectId()
        self.user_id = ObjectId()

    @patch("liveblog.tenancy.registration.get_resource_service")
    def test_successful_registration(self, mock_get_service):
        """Test successful user registration creates both tenant and user."""
        # Mock tenants service
        mock_tenants_service = MagicMock()
        mock_tenants_service.post.return_value = [self.tenant_id]
        mock_tenants_service.find_one.return_value = {"_id": self.tenant_id}

        # Mock users service
        mock_users_service = MagicMock()
        mock_users_service.post.return_value = [self.user_id]
        # find_one returns None for both username and email checks (no existing users)
        mock_users_service.find_one.return_value = None

        # Mock get_resource_service to return appropriate service
        def get_service_side_effect(resource_name):
            if resource_name == "tenants":
                return mock_tenants_service
            elif resource_name == "users":
                return mock_users_service
            return MagicMock()

        mock_get_service.side_effect = get_service_side_effect

        result = self.registration_service.register_new_user(self.valid_user_data)

        # Verify result
        self.assertEqual(result["user_id"], self.user_id)
        self.assertEqual(result["tenant_id"], self.tenant_id)
        self.assertIn("tenant_name", result)

        # Verify tenant was created
        mock_tenants_service.post.assert_called_once()
        tenant_data = mock_tenants_service.post.call_args[0][0][0]
        self.assertEqual(tenant_data["subscription_level"], "solo")

        # Verify user was created with tenant_id
        mock_users_service.post.assert_called_once()
        user_data = mock_users_service.post.call_args[0][0][0]
        self.assertEqual(user_data["tenant_id"], self.tenant_id)
        self.assertEqual(user_data["username"], "newuser")

        # Verify tenant was updated with owner_user_id
        mock_tenants_service.patch.assert_called_once_with(
            self.tenant_id, {"owner_user_id": self.user_id}
        )

    @patch("liveblog.tenancy.registration.get_resource_service")
    def test_duplicate_username_raises_error(self, mock_get_service):
        """Test registration fails when username already exists."""
        mock_users_service = MagicMock()
        # Simulate existing user found with find_one
        mock_users_service.find_one.return_value = {
            "_id": ObjectId(),
            "username": "newuser",
        }

        def get_service_side_effect(resource_name):
            if resource_name == "users":
                return mock_users_service
            return MagicMock()

        mock_get_service.side_effect = get_service_side_effect

        with self.assertRaises(SuperdeskApiError) as context:
            self.registration_service.register_new_user(self.valid_user_data)

        self.assertIn("already exists", str(context.exception).lower())

    @patch("liveblog.tenancy.registration.get_resource_service")
    def test_duplicate_email_raises_error(self, mock_get_service):
        """Test registration fails when email already exists."""
        mock_users_service = MagicMock()
        # Username check passes (returns None), email check fails (returns existing user)
        mock_users_service.find_one.side_effect = [
            None,  # Username check passes
            {"_id": ObjectId(), "email": "newuser@example.com"},  # Email check fails
        ]

        def get_service_side_effect(resource_name):
            if resource_name == "users":
                return mock_users_service
            return MagicMock()

        mock_get_service.side_effect = get_service_side_effect

        with self.assertRaises(SuperdeskApiError) as context:
            self.registration_service.register_new_user(self.valid_user_data)

        self.assertIn("already exists", str(context.exception).lower())

    @patch("liveblog.tenancy.registration.get_resource_service")
    def test_rollback_on_user_creation_failure(self, mock_get_service):
        """Test tenant is deleted if user creation fails."""
        mock_tenants_service = MagicMock()
        mock_tenants_service.post.return_value = [self.tenant_id]
        mock_tenants_service.find_one.return_value = {"_id": self.tenant_id}

        mock_users_service = MagicMock()
        # Validation checks pass
        mock_users_service.find_one.return_value = None
        # Simulate user creation failure
        mock_users_service.post.side_effect = Exception("Database error")

        def get_service_side_effect(resource_name):
            if resource_name == "tenants":
                return mock_tenants_service
            elif resource_name == "users":
                return mock_users_service
            return MagicMock()

        mock_get_service.side_effect = get_service_side_effect

        with self.assertRaises(Exception) as context:
            self.registration_service.register_new_user(self.valid_user_data)

        self.assertIn("Database error", str(context.exception))

        # Verify tenant was deleted (rollback)
        mock_tenants_service.delete_action.assert_called_once_with(
            {"_id": self.tenant_id}
        )

    def test_generate_tenant_name(self):
        """Test tenant name generation from user data."""
        tenant_name = self.registration_service._generate_tenant_name(
            self.valid_user_data
        )

        self.assertIsInstance(tenant_name, str)
        self.assertGreater(len(tenant_name), 0)
        self.assertTrue(
            "New" in tenant_name or "User" in tenant_name or "newuser" in tenant_name
        )

    @patch("liveblog.tenancy.registration.get_resource_service")
    def test_registration_sets_user_type_administrator(self, mock_get_service):
        """Test registration sets user_type to 'administrator'."""
        mock_tenants_service = MagicMock()
        mock_tenants_service.post.return_value = [self.tenant_id]
        mock_tenants_service.find_one.return_value = {"_id": self.tenant_id}

        mock_users_service = MagicMock()
        mock_users_service.post.return_value = [self.user_id]
        # Validation checks pass
        mock_users_service.find_one.return_value = None

        def get_service_side_effect(resource_name):
            if resource_name == "tenants":
                return mock_tenants_service
            elif resource_name == "users":
                return mock_users_service
            return MagicMock()

        mock_get_service.side_effect = get_service_side_effect

        self.registration_service.register_new_user(self.valid_user_data)

        # Verify user_type is set to administrator
        user_data = mock_users_service.post.call_args[0][0][0]
        self.assertEqual(user_data["user_type"], "administrator")
