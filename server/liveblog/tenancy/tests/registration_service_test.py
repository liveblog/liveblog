"""
Integration tests for RegistrationService.

Tests the service-layer business logic for user registration.
Focuses on unique service-layer concerns like rollback behavior
and internal methods. End-to-end validation is covered by
registration_endpoint_test.py.
"""

from superdesk.tests import TestCase
from superdesk import get_resource_service
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
                    # Username/email checks pass (uses regular find_one)
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

    def test_stripe_failure_succeeds_without_customer_id(self):
        """Stripe customer creation is best-effort at registration.
        If it fails, registration succeeds but stripe_customer_id is
        null. The Stripe customer will be created lazily when the user
        first hits a billing endpoint."""
        from unittest.mock import patch

        with patch.object(
            self.registration_service, "_get_stripe_key", return_value="sk_test_fake"
        ), patch.object(
            self.registration_service, "_create_stripe_customer", return_value=None
        ):
            result = self.registration_service.register_new_user(self.valid_user_data)

        self.assertIn("user_id", result)
        self.assertIn("tenant_id", result)

        tenant = get_resource_service("tenants").find_one(
            req=None, _id=result["tenant_id"]
        )
        self.assertIsNone(tenant.get("stripe_customer_id"))

    def test_generate_tenant_name(self):
        """Test tenant name generation from user data (internal method)."""
        tenant_name = self.registration_service._generate_tenant_name(
            self.valid_user_data
        )

        self.assertIsInstance(tenant_name, str)
        self.assertGreater(len(tenant_name), 0)
        self.assertTrue(
            "New" in tenant_name or "User" in tenant_name or "newuser" in tenant_name
        )
