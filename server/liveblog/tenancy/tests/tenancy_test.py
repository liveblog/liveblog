"""
Unit tests for tenant context functions.

Tests the core tenant identification and retrieval functions that provide
tenant context throughout request lifecycle.
"""

import flask
from bson import ObjectId
from unittest.mock import patch, MagicMock

from superdesk.tests import TestCase
from superdesk.errors import SuperdeskApiError
from liveblog.tenancy import get_tenant_id, get_tenant
from liveblog.tenancy.context import (
    set_current_tenant_id,
    reset_current_tenant_id,
    set_system_mode,
    reset_system_mode,
)


class TenancyContextTestCase(TestCase):
    """Test tenant context retrieval functions."""

    def setUp(self):
        """Set up test fixtures."""
        self.tenant_id = ObjectId()
        self.user_with_tenant = {
            "_id": ObjectId(),
            "username": "testuser",
            "email": "test@example.com",
            "tenant_id": self.tenant_id,
        }

        self.user_without_tenant = {
            "_id": ObjectId(),
            "username": "notenant",
            "email": "notenant@example.com",
        }

        self.tenant_doc = {
            "_id": self.tenant_id,
            "name": "Test Tenant",
            "subscription_level": "solo",
            "settings": {},
        }

    def test_get_tenant_id_with_authenticated_user(self):
        """Test get_tenant_id returns tenant_id from authenticated user."""
        flask.g.user = self.user_with_tenant

        tenant_id = get_tenant_id()

        self.assertEqual(tenant_id, self.tenant_id)

    def test_get_tenant_id_without_user_not_required(self):
        """Test get_tenant_id returns None when no user and not required."""
        # Ensure no user in flask.g
        if hasattr(flask.g, "user"):
            delattr(flask.g, "user")

        tenant_id = get_tenant_id(required=False)

        self.assertIsNone(tenant_id)

    def test_get_tenant_id_without_user_required(self):
        """Test get_tenant_id raises SuperdeskApiError when no user and required."""
        # Ensure no user in flask.g
        if hasattr(flask.g, "user"):
            delattr(flask.g, "user")

        with self.assertRaises(SuperdeskApiError) as context:
            get_tenant_id(required=True)

        self.assertEqual(context.exception.status_code, 403)

    def test_get_tenant_id_user_without_tenant_not_required(self):
        """Test get_tenant_id returns None when user has no tenant_id and not required."""
        flask.g.user = self.user_without_tenant

        tenant_id = get_tenant_id(required=False)

        self.assertIsNone(tenant_id)

    def test_get_tenant_id_user_without_tenant_required(self):
        """Test get_tenant_id raises SuperdeskApiError when user has no tenant_id and required."""
        flask.g.user = self.user_without_tenant

        with self.assertRaises(SuperdeskApiError) as context:
            get_tenant_id(required=True)

        self.assertEqual(context.exception.status_code, 403)

    @patch("superdesk.get_resource_service")
    def test_get_tenant_with_valid_tenant_id(self, mock_get_service):
        """Test get_tenant retrieves tenant document from database."""
        mock_tenants_service = MagicMock()
        mock_tenants_service.find_one.return_value = self.tenant_doc
        mock_get_service.return_value = mock_tenants_service

        flask.g.user = self.user_with_tenant

        tenant = get_tenant()

        self.assertEqual(tenant, self.tenant_doc)
        mock_get_service.assert_called_once_with("tenants")
        mock_tenants_service.find_one.assert_called_once_with(
            req=None, _id=self.tenant_id
        )

    @patch("superdesk.get_resource_service")
    def test_get_tenant_caching(self, mock_get_service):
        """Test get_tenant caches result per request."""
        mock_tenants_service = MagicMock()
        mock_tenants_service.find_one.return_value = self.tenant_doc
        mock_get_service.return_value = mock_tenants_service

        flask.g.user = self.user_with_tenant

        # First call should hit database
        tenant1 = get_tenant()

        # Second call should use cache
        tenant2 = get_tenant()

        # Should only call database once
        self.assertEqual(mock_tenants_service.find_one.call_count, 1)
        self.assertEqual(tenant1, tenant2)
        self.assertEqual(tenant1, self.tenant_doc)

    def test_get_tenant_without_user_not_required(self):
        """Test get_tenant returns None when no user and not required."""
        if hasattr(flask.g, "user"):
            delattr(flask.g, "user")

        tenant = get_tenant(required=False)

        self.assertIsNone(tenant)

    def test_get_tenant_without_user_required(self):
        """Test get_tenant raises SuperdeskApiError when no user and required."""
        if hasattr(flask.g, "user"):
            delattr(flask.g, "user")

        with self.assertRaises(SuperdeskApiError) as context:
            get_tenant(required=True)

        self.assertEqual(context.exception.status_code, 403)

    def test_get_tenant_id_without_request_context_returns_none(self):
        with self.app.app_context():
            tenant_id = get_tenant_id(required=False)

        self.assertIsNone(tenant_id)

    def test_get_tenant_id_without_request_context_required_raises(self):
        with self.app.app_context():
            with self.assertRaises(SuperdeskApiError) as context:
                get_tenant_id(required=True)

        self.assertEqual(context.exception.status_code, 403)

    def test_get_tenant_without_request_context_returns_none(self):
        with self.app.app_context():
            tenant = get_tenant(required=False)

        self.assertIsNone(tenant)

    def test_get_tenant_id_uses_contextvar_outside_request_context(self):
        token = set_current_tenant_id(self.tenant_id)
        try:
            with self.app.app_context():
                tenant_id = get_tenant_id(required=False)
        finally:
            reset_current_tenant_id(token)

        self.assertEqual(tenant_id, self.tenant_id)

    def test_get_tenant_id_returns_none_in_system_mode(self):
        token = set_system_mode()
        try:
            with self.app.app_context():
                tenant_id = get_tenant_id(required=False)
        finally:
            reset_system_mode(token)

        self.assertIsNone(tenant_id)
