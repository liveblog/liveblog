"""
Theme Settings Resource and Service

Manages tenant-specific theme customizations.
"""
from superdesk.resource import Resource
from liveblog.tenancy.service import TenantAwareService


class ThemeSettingsResource(Resource):
    """
    Resource for theme settings per tenant.

    Each entry represents one tenant's customizations for one theme.
    Settings stored here override theme defaults but are overridden by blog settings.
    """

    schema = {
        "tenant_id": Resource.rel("tenants", type="objectid", required=True),
        "theme_name": {
            "type": "string",
            "required": True,
            "minlength": 3,
            "maxlength": 50,
        },
        "settings": {
            "type": "dict",
            "mapping": {"type": "object", "enabled": False},
            "default": {},
        },
        "style_settings": {
            "type": "dict",
            "mapping": {"type": "object", "enabled": False},
            "default": {},
        },
    }

    datasource = {
        "source": "theme_settings",
        "default_sort": [("_updated", -1)],
        "search_backend": None,
    }

    mongo_indexes = {
        # Unique constraint: one entry per theme per tenant
        "tenant_theme_unique": {
            "key": [("tenant_id", 1), ("theme_name", 1)],
            "unique": True,
        }
    }

    # No API endpoints - this is an internal resource
    internal_resource = True
    item_methods = []
    resource_methods = []


class ThemeSettingsService(TenantAwareService):
    """
    Service for managing theme settings per tenant.

    Tenant filtering is automatic via TenantAwareService base class.
    Each tenant can only access their own theme settings.
    """

    def get_or_create(self, tenant_id, theme_name):
        """
        Get existing theme settings for tenant, or return empty dict.

        Args:
            tenant_id: Tenant ObjectId
            theme_name: Theme name string

        Returns:
            dict: Theme settings document or empty dict if not found
        """
        existing = self.find_one(req=None, tenant_id=tenant_id, theme_name=theme_name)
        return existing if existing else {}

    def save_settings_for_tenant(self, tenant_id, theme_name, settings, style_settings=None):
        """
        Upsert theme settings for tenant.

        Creates new entry if doesn't exist, updates if exists.

        Args:
            tenant_id: Tenant ObjectId
            theme_name: Theme name string
            settings: Settings dict to save
            style_settings: Optional style settings dict

        Returns:
            ObjectId: ID of created/updated document
        """
        existing = self.find_one(req=None, tenant_id=tenant_id, theme_name=theme_name)

        update_doc = {"settings": settings}
        if style_settings is not None:
            update_doc["style_settings"] = style_settings

        if existing:
            # Update existing
            self.patch(existing["_id"], update_doc)
            return existing["_id"]
        else:
            # Create new
            doc = {
                "tenant_id": tenant_id,
                "theme_name": theme_name,
                **update_doc,
            }
            ids = self.post([doc])
            return ids[0]

    def get_settings_for_tenant(self, tenant_id, theme_name):
        """
        Get theme settings for specific tenant and theme.

        Args:
            tenant_id: Tenant ObjectId
            theme_name: Theme name string

        Returns:
            dict: Settings dict, or empty dict if not found
        """
        doc = self.find_one(req=None, tenant_id=tenant_id, theme_name=theme_name)
        return doc.get("settings", {}) if doc else {}

    def get_style_settings_for_tenant(self, tenant_id, theme_name):
        """
        Get theme style settings for specific tenant and theme.

        Args:
            tenant_id: Tenant ObjectId
            theme_name: Theme name string

        Returns:
            dict: Style settings dict, or empty dict if not found
        """
        doc = self.find_one(req=None, tenant_id=tenant_id, theme_name=theme_name)
        return doc.get("style_settings", {}) if doc else {}

    def delete_by_theme(self, theme_name, tenant_id=None):
        """
        Delete theme_settings entries for a theme.

        Used when theme is deleted.

        Args:
            theme_name: Theme name to delete settings for
            tenant_id: Optional - if provided, only delete for this tenant
                      if None, delete for all tenants (system theme deletion)
        """
        lookup = {"theme_name": theme_name}
        if tenant_id is not None:
            lookup["tenant_id"] = tenant_id

        self.delete(lookup=lookup)
