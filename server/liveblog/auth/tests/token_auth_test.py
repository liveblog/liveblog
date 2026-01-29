"""
Integration tests for LiveBlogTokenAuth.

Tests that the custom token authentication properly uses the
find_one_for_authentication method to bypass tenant filtering
during auth token validation.

These tests use real database operations instead of mocking to
ensure actual behavior is tested.
"""
import flask

from bson import ObjectId
from superdesk.tests import TestCase
from superdesk import get_resource_service
from superdesk.utc import utcnow

from liveblog import tenants, users
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

        # Initialize tenants and users modules for tests
        for lb_app in [tenants, users]:
            lb_app.init_app(self.app)

    def setUp(self):
        """Ensure clean state before each test."""
        super().setUp()
        self.setup_test_case()

        # Swap auth to LiveBlogTokenAuth for this test suite
        if not isinstance(self.app.auth, LiveBlogTokenAuth):
            self.app.auth = LiveBlogTokenAuth()

        # Ensure no tenant context from previous tests
        with self.app.test_request_context():
            import flask
            for attr in ['user', 'tenant_cached', 'role', 'auth', 'auth_value']:
                if hasattr(flask.g, attr):
                    delattr(flask.g, attr)

    def tearDown(self):
        """Clean up flask.g to prevent tenant context from leaking to other tests."""
        with self.app.test_request_context():
            import flask
            for attr in list(flask.g.__dict__.keys()):
                try:
                    delattr(flask.g, attr)
                except AttributeError:
                    pass

        super().tearDown()

    def test_app_uses_liveblog_token_auth(self):
        """Test that self.app.auth is LiveBlogTokenAuth instance."""
        self.assertIsInstance(self.app.auth, LiveBlogTokenAuth)

    def test_check_auth_with_valid_token(self):
        """Test authentication flow with real database and valid token."""
        # Create real tenant
        tenants_service = get_resource_service('tenants')
        tenant_ids = tenants_service.post([{'name': 'Test Tenant'}])
        tenant_id = ObjectId(tenant_ids[0])

        # Create real user
        users_service = get_resource_service('users')
        user_data = {
            'username': 'testuser_auth',
            'email': 'testauth@example.com',
            'password': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User',
            'tenant_id': tenant_id,
            'user_type': 'administrator'
        }
        user_ids = users_service.post([user_data])
        user_id = ObjectId(user_ids[0])

        # Create auth token directly in database (bypass service validation)
        token_value = 'test-token-' + str(ObjectId())
        auth_data = {
            'user': user_id,
            'token': token_value,
            '_updated': utcnow()
        }
        self.app.data.insert('auth', [auth_data])

        # Test authentication
        auth = LiveBlogTokenAuth()
        with self.app.test_request_context():
            result = auth.check_auth(token_value, [], 'users', 'GET')

            # Verify authentication succeeded
            self.assertTrue(result)

            # Verify flask.g is populated correctly
            self.assertEqual(flask.g.user['_id'], user_id)
            self.assertEqual(flask.g.user['tenant_id'], tenant_id)
            self.assertEqual(flask.g.user['username'], 'testuser_auth')
            self.assertIsNotNone(flask.g.auth)
            self.assertEqual(flask.g.auth_value, user_id)

    def test_check_auth_with_invalid_token(self):
        """Test authentication fails gracefully with invalid token."""
        auth = LiveBlogTokenAuth()
        with self.app.test_request_context():
            result = auth.check_auth('invalid-token-12345', [], 'users', 'GET')

            # Verify authentication failed
            self.assertIsNone(result)

            # Verify flask.g.user was not set
            self.assertFalse(hasattr(flask.g, 'user'))

    def test_check_auth_bypasses_tenant_filtering(self):
        """
        Test that authentication uses find_one_for_authentication
        to bypass tenant filtering during user lookup.

        This is critical because tenant filtering requires flask.g.user
        to be set, but we're IN THE PROCESS of setting it during auth.
        """
        # Create tenant A
        tenants_service = get_resource_service('tenants')
        tenant_a_id = ObjectId(tenants_service.post([{'name': 'Tenant A'}])[0])

        # Create user in tenant A
        users_service = get_resource_service('users')
        user_data = {
            'username': 'user_tenant_a',
            'email': 'usera@example.com',
            'password': 'testpass123',
            'first_name': 'User',
            'last_name': 'A',
            'tenant_id': tenant_a_id,
            'user_type': 'administrator'
        }
        user_id = ObjectId(users_service.post([user_data])[0])

        # Create auth token directly in database
        token_value = 'test-token-' + str(ObjectId())
        auth_data = {
            'user': user_id,
            'token': token_value,
            '_updated': utcnow()
        }
        self.app.data.insert('auth', [auth_data])

        # Test authentication WITHOUT any tenant context set
        auth = LiveBlogTokenAuth()
        with self.app.test_request_context():
            # Verify no tenant context exists
            self.assertFalse(hasattr(flask.g, 'user'))

            # Authenticate - this should work even without tenant context
            result = auth.check_auth(token_value, [], 'users', 'GET')

            # Verify authentication succeeded
            self.assertTrue(result)
            self.assertEqual(flask.g.user['_id'], user_id)
            self.assertEqual(flask.g.user['tenant_id'], tenant_a_id)

    def test_check_auth_finds_user_across_tenants(self):
        """
        Test that authentication finds users from any tenant.

        Auth tokens are system-level, not tenant-scoped, so authentication
        must bypass tenant filtering to find the user regardless of which
        tenant they belong to.
        """
        # Create two different tenants
        tenants_service = get_resource_service('tenants')
        tenant_a_id = ObjectId(tenants_service.post([{'name': 'Tenant A'}])[0])
        tenant_b_id = ObjectId(tenants_service.post([{'name': 'Tenant B'}])[0])

        # Create user in tenant B
        users_service = get_resource_service('users')
        user_b_data = {
            'username': 'user_tenant_b',
            'email': 'userb@example.com',
            'password': 'testpass123',
            'first_name': 'User',
            'last_name': 'B',
            'tenant_id': tenant_b_id,
            'user_type': 'administrator'
        }
        user_b_id = ObjectId(users_service.post([user_b_data])[0])

        # Create auth token directly in database
        token_value = 'test-token-' + str(ObjectId())
        auth_data = {
            'user': user_b_id,
            'token': token_value,
            '_updated': utcnow()
        }
        self.app.data.insert('auth', [auth_data])

        # Simulate a scenario where flask.g has a user from tenant A
        with self.app.test_request_context():
            # Set a different tenant in context (tenant A)
            flask.g.user = {'tenant_id': tenant_a_id}

            # Authenticate user from tenant B - should still work
            auth = LiveBlogTokenAuth()
            result = auth.check_auth(token_value, [], 'users', 'GET')

            # Verify authentication succeeded and found user from tenant B
            self.assertTrue(result)
            self.assertEqual(flask.g.user['_id'], user_b_id)
            self.assertEqual(flask.g.user['tenant_id'], tenant_b_id)
            self.assertEqual(flask.g.user['username'], 'user_tenant_b')
