"""
Unit tests for TenantAwareService.

Tests the automatic tenant filtering functionality that ensures data isolation
between tenants at the service layer.

Note: This file tests the TenantAwareService BASE CLASS using unit tests with mocking,
which is appropriate for testing abstract class contracts. Integration testing of
actual tenant isolation with real services and database is covered by:
- liveblog/tenancy/tests/registration_test.py
- liveblog/auth/tests/token_auth_test.py
- liveblog/auth/tests/registration_test.py
"""

import flask
from bson import ObjectId
from unittest.mock import patch, MagicMock

from superdesk.tests import TestCase
from liveblog.tenancy.service import TenantAwareService


class TenantAwareServiceTestCase(TestCase):
    """Test TenantAwareService filtering behavior."""

    def setUp(self):
        """Set up test fixtures."""
        self.tenant_id = ObjectId()
        self.user_with_tenant = {
            "_id": ObjectId(),
            "username": "testuser",
            "email": "test@example.com",
            "tenant_id": self.tenant_id,
        }

        # Create a test service instance
        self.service = TenantAwareService("test_resource", backend=MagicMock())

    def test_add_tenant_filter_with_tenant(self):
        """Test _add_tenant_filter adds tenant_id to lookup when user has tenant."""
        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            lookup = {"some_field": "value"}
            result = self.service._add_tenant_filter(lookup)

            self.assertIn("tenant_id", result)
            self.assertEqual(result["tenant_id"], self.tenant_id)
            self.assertEqual(result["some_field"], "value")

    def test_add_tenant_filter_without_tenant(self):
        """Test _add_tenant_filter does not modify lookup when no tenant."""
        with self.app.app_context():
            if hasattr(flask.g, "user"):
                delattr(flask.g, "user")

            lookup = {"some_field": "value"}
            result = self.service._add_tenant_filter(lookup)

            self.assertNotIn("tenant_id", result)
            self.assertEqual(result["some_field"], "value")

    def test_add_tenant_filter_converts_string_to_objectid(self):
        """Test _add_tenant_filter converts string tenant_id to ObjectId."""
        with self.app.app_context():
            user_with_string_tenant = self.user_with_tenant.copy()
            user_with_string_tenant["tenant_id"] = str(self.tenant_id)
            flask.g.user = user_with_string_tenant

            lookup = {}
            result = self.service._add_tenant_filter(lookup)

            self.assertIn("tenant_id", result)
            self.assertIsInstance(result["tenant_id"], ObjectId)
            self.assertEqual(result["tenant_id"], self.tenant_id)

    @patch.object(TenantAwareService, "_add_tenant_filter")
    def test_find_applies_tenant_filter(self, mock_add_filter):
        """Test find() method applies tenant filter to where clause."""
        mock_add_filter.return_value = {"tenant_id": self.tenant_id}

        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            # Mock the parent find method
            with patch("superdesk.services.BaseService.find") as mock_parent_find:
                mock_parent_find.return_value = MagicMock()

                where = {"field": "value"}
                self.service.find(where)

                # Verify tenant filter was applied
                mock_add_filter.assert_called_once()
                mock_parent_find.assert_called_once()

    @patch.object(TenantAwareService, "_add_tenant_filter")
    def test_find_with_none_where(self, mock_add_filter):
        """Test find() creates empty where dict when None provided."""
        mock_add_filter.return_value = {"tenant_id": self.tenant_id}

        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            with patch("superdesk.services.BaseService.find") as mock_parent_find:
                mock_parent_find.return_value = MagicMock()

                self.service.find(None)

                # Should call with empty dict that gets filtered
                mock_add_filter.assert_called_once()
                call_args = mock_add_filter.call_args[0][0]
                self.assertIsInstance(call_args, dict)

    @patch.object(TenantAwareService, "_add_tenant_filter")
    def test_find_one_applies_tenant_filter(self, mock_add_filter):
        """Test find_one() method applies tenant filter to lookup."""
        mock_add_filter.return_value = {"_id": "doc_id", "tenant_id": self.tenant_id}

        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            mock_backend = MagicMock()
            mock_backend.find_one.return_value = {"_id": "doc_id"}

            with patch("flask.current_app") as mock_app:
                mock_app.data._backend.return_value = mock_backend

                req = MagicMock()
                result = self.service.find_one(req, _id="doc_id")

                mock_add_filter.assert_called_once()
                mock_backend.find_one.assert_called_once_with(
                    "test_resource", req=req, _id="doc_id", tenant_id=self.tenant_id
                )
                self.assertEqual(result, {"_id": "doc_id"})

    @patch.object(TenantAwareService, "_add_tenant_filter")
    def test_get_applies_tenant_filter(self, mock_add_filter):
        """Test get() method applies tenant filter to lookup."""
        mock_add_filter.return_value = {"tenant_id": self.tenant_id}

        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            with patch("superdesk.services.BaseService.get") as mock_parent_get:
                mock_parent_get.return_value = MagicMock()

                req = MagicMock()
                lookup = {"field": "value"}
                self.service.get(req, lookup)

                mock_add_filter.assert_called_once()
                mock_parent_get.assert_called_once()

    def test_on_create_adds_tenant_id_to_documents(self):
        """Test on_create adds tenant_id to new documents."""
        with self.app.app_context():
            flask.g.user = self.user_with_tenant

            docs = [
                {"title": "Doc 1"},
                {"title": "Doc 2"},
                {"title": "Doc 3", "tenant_id": ObjectId()},  # Should not override
            ]

            with patch("superdesk.services.BaseService.on_create"):
                self.service.on_create(docs)

                # First two docs should have tenant_id added
                self.assertEqual(docs[0]["tenant_id"], self.tenant_id)
                self.assertEqual(docs[1]["tenant_id"], self.tenant_id)

                # Third doc should keep its original tenant_id
                self.assertNotEqual(docs[2]["tenant_id"], self.tenant_id)

    def test_on_create_converts_string_tenant_id_to_objectid(self):
        """Test on_create converts string tenant_id to ObjectId."""
        with self.app.app_context():
            user_with_string_tenant = self.user_with_tenant.copy()
            user_with_string_tenant["tenant_id"] = str(self.tenant_id)
            flask.g.user = user_with_string_tenant

            docs = [{"title": "Doc 1"}]

            with patch("superdesk.services.BaseService.on_create"):
                self.service.on_create(docs)

                self.assertIsInstance(docs[0]["tenant_id"], ObjectId)
                self.assertEqual(docs[0]["tenant_id"], self.tenant_id)

    def test_on_create_without_tenant_raises_forbidden(self):
        """Test on_create raises SuperdeskApiError when no tenant context (required=True)."""
        from superdesk.errors import SuperdeskApiError

        with self.app.app_context():
            if hasattr(flask.g, "user"):
                delattr(flask.g, "user")

            docs = [{"title": "Doc 1"}]

            with self.assertRaises(SuperdeskApiError) as context:
                self.service.on_create(docs)

            self.assertEqual(context.exception.status_code, 403)
