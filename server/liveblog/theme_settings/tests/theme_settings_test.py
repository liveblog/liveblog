"""
Unit tests for ThemeSettingsService.

Tests the theme_settings service methods, particularly the new get_settings_for_blog()
helper method that supports blog rendering with tenant customizations.
"""

import flask
from bson import ObjectId
from unittest.mock import patch, MagicMock

import liveblog.themes as themes_app
import liveblog.tenants as tenants_app
from liveblog.tests.tenant_test_case import TenantAwareTestCase
from liveblog.theme_settings import init_app as theme_settings_init
from liveblog.instance_settings.features_service import FeaturesService
from superdesk import get_resource_service


def db_service_mock():
    """Mock database service with a method to simulate database config retrieval."""
    db_service = MagicMock()
    db_service.get_existing_config = MagicMock()
    return db_service


class ThemeSettingsTestCase(TenantAwareTestCase):
    """Test ThemeSettingsService methods."""

    def setUp(self):
        """Set up test fixtures."""
        super().setUp()

        # Initialize required apps
        tenants_app.init_app(self.app)
        themes_app.init_app(self.app)
        theme_settings_init(self.app)

        # Set up tenant and user
        self.setup_tenant_and_user()

        # Mock features service
        self.app.features = FeaturesService(self.app, db_service_mock())
        self.app.features.current_sub_level = MagicMock(return_value="network")

        # Create a test theme (standalone, no extends to avoid dependencies)
        themes_service = get_resource_service("themes")
        self.theme_name = "test-theme"
        self.theme_id = themes_service.post(
            [
                {
                    "name": self.theme_name,
                    "options": [
                        {"name": "postsPerPage", "default": "10"},
                        {"name": "color", "default": "blue"},
                    ],
                }
            ]
        )[0]

        self.theme_settings_service = get_resource_service("theme_settings")

    def test_get_settings_for_blog_with_tenant(self):
        """Test get_settings_for_blog returns effective settings for blog with tenant_id."""
        # Create tenant customization
        self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"postsPerPage": "20", "color": "red"},
        )

        # Blog with tenant_id
        blog = {
            "_id": ObjectId(),
            "tenant_id": self.tenant_id,
            "blog_preferences": {"theme": self.theme_name},
        }

        # Get settings for blog
        settings = self.theme_settings_service.get_settings_for_blog(
            blog, self.theme_name
        )

        # Should return merged settings (tenant customizations override defaults)
        self.assertEqual(settings["postsPerPage"], "20")
        self.assertEqual(settings["color"], "red")

    def test_get_settings_for_blog_without_tenant_raises_error(self):
        """Test get_settings_for_blog raises error when blog missing tenant_id."""
        from superdesk.errors import SuperdeskApiError

        # Blog without tenant_id (data integrity issue)
        blog = {"_id": ObjectId(), "blog_preferences": {"theme": self.theme_name}}

        # Should raise error - blogs must have tenant_id in multi-tenant system
        with self.assertRaises(SuperdeskApiError) as context:
            self.theme_settings_service.get_settings_for_blog(blog, self.theme_name)

        self.assertEqual(context.exception.status_code, 400)

    def test_get_settings_for_blog_without_customizations(self):
        """Test get_settings_for_blog returns defaults when tenant has no customizations."""
        # Blog with tenant_id but no customizations
        blog = {
            "_id": ObjectId(),
            "tenant_id": self.tenant_id,
            "blog_preferences": {"theme": self.theme_name},
        }

        # Get settings for blog (no customizations saved)
        settings = self.theme_settings_service.get_settings_for_blog(
            blog, self.theme_name
        )

        # Should return theme defaults
        self.assertEqual(settings["postsPerPage"], "10")
        self.assertEqual(settings["color"], "blue")

    def test_get_settings_for_blog_partial_customization(self):
        """Test get_settings_for_blog merges partial customizations correctly."""
        # Create partial tenant customization (only one setting)
        self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"postsPerPage": "25"},
        )

        blog = {
            "_id": ObjectId(),
            "tenant_id": self.tenant_id,
            "blog_preferences": {"theme": self.theme_name},
        }

        settings = self.theme_settings_service.get_settings_for_blog(
            blog, self.theme_name
        )

        # Custom setting overrides default
        self.assertEqual(settings["postsPerPage"], "25")
        # Non-customized setting uses default
        self.assertEqual(settings["color"], "blue")

    def test_get_settings_for_blog_nonexistent_theme(self):
        """Test get_settings_for_blog returns empty dict for nonexistent theme."""
        blog = {
            "_id": ObjectId(),
            "tenant_id": self.tenant_id,
            "blog_preferences": {"theme": "nonexistent-theme"},
        }

        settings = self.theme_settings_service.get_settings_for_blog(
            blog, "nonexistent-theme"
        )

        self.assertEqual(settings, {})

    def test_get_settings_for_blog_string_tenant_id(self):
        """Test get_settings_for_blog handles string tenant_id correctly."""
        # Create tenant customization
        self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"postsPerPage": "30"},
        )

        # Blog with string tenant_id
        blog = {
            "_id": ObjectId(),
            "tenant_id": str(self.tenant_id),  # String instead of ObjectId
            "blog_preferences": {"theme": self.theme_name},
        }

        settings = self.theme_settings_service.get_settings_for_blog(
            blog, self.theme_name
        )

        # Should handle string tenant_id and return customizations
        self.assertEqual(settings["postsPerPage"], "30")

    def test_save_or_update_settings(self):
        """Test save_or_update_settings creates and updates settings correctly."""
        # First save - should create new entry
        doc_id = self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"postsPerPage": "15"},
        )

        self.assertIsNotNone(doc_id)

        # Verify settings were saved
        settings = self.theme_settings_service.get_settings_for_tenant(
            self.tenant_id, self.theme_name
        )
        self.assertEqual(settings["postsPerPage"], "15")

        # Second save - should update existing entry
        doc_id2 = self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"postsPerPage": "20", "color": "green"},
        )

        # Should return same document ID
        self.assertEqual(doc_id, doc_id2)

        # Verify settings were updated
        settings = self.theme_settings_service.get_settings_for_tenant(
            self.tenant_id, self.theme_name
        )
        self.assertEqual(settings["postsPerPage"], "20")
        self.assertEqual(settings["color"], "green")

    def test_get_effective_settings(self):
        """Test get_effective_settings merges theme defaults with tenant customizations."""
        # Create tenant customization
        self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"color": "yellow"},
        )

        effective = self.theme_settings_service.get_effective_settings(
            self.theme_name, self.tenant_id
        )

        # Should have theme default for postsPerPage
        self.assertEqual(effective["postsPerPage"], "10")
        # Should have tenant customization for color
        self.assertEqual(effective["color"], "yellow")

    def test_tenant_isolation(self):
        """Test tenant isolation - different tenants have separate settings."""
        # Create second tenant
        from liveblog.tenancy.context import system_context

        tenants_service = get_resource_service("tenants")
        tenant2_id = tenants_service.post([{"name": "Tenant 2"}])[0]

        # Tenant 1 customization
        self.theme_settings_service.save_or_update_settings(
            theme_name=self.theme_name,
            tenant_id=self.tenant_id,
            settings_payload={"postsPerPage": "20"},
        )

        # Tenant 2 customization - bypass tenant filtering to write for another tenant
        with system_context():
            self.theme_settings_service.save_or_update_settings(
                theme_name=self.theme_name,
                tenant_id=tenant2_id,
                settings_payload={"postsPerPage": "30"},
            )

        # Verify tenant 1 sees their own settings
        settings1 = self.theme_settings_service.get_effective_settings(
            self.theme_name, self.tenant_id
        )
        self.assertEqual(settings1["postsPerPage"], "20")

        # Verify tenant 2 sees their own settings
        with system_context():
            settings2 = self.theme_settings_service.get_effective_settings(
                self.theme_name, tenant2_id
            )
            self.assertEqual(settings2["postsPerPage"], "30")
