"""
Integration tests for RegistrationService.

Tests the user registration service that automatically creates tenants
and handles rollback on failures using real database operations.
"""

from bson import ObjectId
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.errors import SuperdeskApiError
from liveblog.tenancy.registration import RegistrationService
from liveblog import tenants, users
from liveblog.common import run_once


class RegistrationServiceTestCase(TestCase):
    """Test RegistrationService user registration logic."""

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

    def setUp(self):
        """Set up test fixtures."""
        super().setUp()
        self.setup_test_case()

        # Create fresh service instance for each test
        self.registration_service = RegistrationService()

        # Use unique username/email for each test to avoid conflicts
        import uuid

        unique_id = str(uuid.uuid4())[:8]
        self.valid_user_data = {
            "username": f"newuser_{unique_id}",
            "email": f"newuser_{unique_id}@example.com",
            "password": "securepass123",
            "first_name": "New",
            "last_name": "User",
        }

    def tearDown(self):
        """Clean up after tests."""
        # Ensure no patches leak between tests
        super().tearDown()

    def test_successful_registration(self):
        """Test successful user registration creates both tenant and user in database."""
        result = self.registration_service.register_new_user(self.valid_user_data)

        # Verify result structure
        self.assertIn("user_id", result)
        self.assertIn("tenant_id", result)
        self.assertIn("tenant_name", result)

        # Verify tenant was created in database
        tenants_service = get_resource_service("tenants")
        tenant = tenants_service.find_one(req=None, _id=result["tenant_id"])
        self.assertIsNotNone(tenant)
        self.assertEqual(tenant["subscription_level"], "solo")
        self.assertIn("New", tenant["name"])

        # Verify user was created with tenant_id
        users_service = get_resource_service("users")
        user = users_service.find_one_for_authentication(str(result["user_id"]))
        self.assertIsNotNone(user)
        self.assertEqual(user["tenant_id"], result["tenant_id"])
        self.assertEqual(user["username"], self.valid_user_data["username"])
        self.assertEqual(user["email"], self.valid_user_data["email"])
        self.assertEqual(user["user_type"], "administrator")

        # Verify tenant was updated with owner_user_id
        self.assertEqual(tenant["owner_user_id"], result["user_id"])

    def test_duplicate_username_raises_error(self):
        """Test registration fails when username already exists."""
        # Create an existing user with the same username
        users_service = get_resource_service("users")
        tenants_service = get_resource_service("tenants")

        # Create a tenant first
        existing_tenant_id = ObjectId(
            tenants_service.post([{"name": "Existing Tenant"}])[0]
        )

        # Create existing user with same username
        existing_user_data = {
            "username": self.valid_user_data[
                "username"
            ],  # Same username as valid_user_data
            "email": "different@example.com",
            "password": "password123",
            "first_name": "Existing",
            "last_name": "User",
            "tenant_id": existing_tenant_id,
        }
        users_service.post([existing_user_data])

        # Try to register with duplicate username
        with self.assertRaises(SuperdeskApiError) as context:
            self.registration_service.register_new_user(self.valid_user_data)

        self.assertIn("already exists", str(context.exception).lower())

    def test_duplicate_email_raises_error(self):
        """Test registration fails when email already exists."""
        # Create an existing user with the same email
        users_service = get_resource_service("users")
        tenants_service = get_resource_service("tenants")

        # Create a tenant first
        existing_tenant_id = ObjectId(
            tenants_service.post([{"name": "Existing Tenant"}])[0]
        )

        # Create existing user with same email
        import uuid

        existing_user_data = {
            "username": f"differentuser_{uuid.uuid4()}",
            "email": self.valid_user_data["email"],  # Same email as valid_user_data
            "password": "password123",
            "first_name": "Existing",
            "last_name": "User",
            "tenant_id": existing_tenant_id,
        }
        users_service.post([existing_user_data])

        # Try to register with duplicate email
        with self.assertRaises(SuperdeskApiError) as context:
            self.registration_service.register_new_user(self.valid_user_data)

        self.assertIn("already exists", str(context.exception).lower())

    def test_rollback_on_user_creation_failure(self):
        """Test tenant is deleted from database if user creation fails."""
        from unittest.mock import patch, MagicMock

        tenants_service = get_resource_service("tenants")

        # Count tenants before
        initial_tenant_count = tenants_service.get(req=None, lookup={}).count()

        # Patch the users_service.post method at the registration service level
        with patch(
            "liveblog.tenancy.registration.get_resource_service"
        ) as mock_get_service:
            # Create mock that fails for users, but works for tenants
            def get_service_side_effect(resource_name):
                if resource_name == "users":
                    # Mock the users service completely
                    mock_users = MagicMock()
                    # Username/email checks pass
                    mock_users.find_one.return_value = None
                    # But post fails
                    mock_users.post.side_effect = Exception(
                        "Database error during user creation"
                    )
                    return mock_users
                # For other services, return real service
                return get_resource_service(resource_name)

            mock_get_service.side_effect = get_service_side_effect

            # Attempt registration
            with self.assertRaises(Exception) as context:
                self.registration_service.register_new_user(self.valid_user_data)

            self.assertIn("Database error", str(context.exception))

        # Verify tenant was rolled back (deleted from database)
        final_tenant_count = tenants_service.get(req=None, lookup={}).count()
        self.assertEqual(
            initial_tenant_count,
            final_tenant_count,
            "Tenant should have been deleted on rollback",
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

    def test_registration_sets_user_type_administrator(self):
        """Test registration sets user_type to 'administrator' in database."""
        result = self.registration_service.register_new_user(self.valid_user_data)

        # Verify user_type is set to administrator in database
        users_service = get_resource_service("users")
        user = users_service.find_one_for_authentication(str(result["user_id"]))

        self.assertIsNotNone(user)
        self.assertEqual(user["user_type"], "administrator")
