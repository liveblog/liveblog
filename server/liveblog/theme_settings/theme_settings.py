"""
Theme Settings Resource and Service

Manages tenant-specific theme customizations.
"""
from bson.objectid import ObjectId
from superdesk.resource import Resource
from superdesk import get_resource_service
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
        "tenant_theme_unique": ([("tenant_id", 1), ("theme_name", 1)], {"unique": True})
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

    def save_settings_for_tenant(
        self, tenant_id, theme_name, settings, style_settings=None
    ):
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
            self.patch(existing["_id"], update_doc)
            return existing["_id"]
        else:
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

    def save_or_update_settings(
        self, theme_name, tenant_id, settings_payload, style_settings_payload=None
    ):
        """
        Save or update theme settings for a tenant.

        Wrapper around save_settings_for_tenant() for convenience.

        Args:
            theme_name: Theme name string
            tenant_id: Tenant ObjectId or string
            settings_payload: Settings dict from frontend
            style_settings_payload: Optional style settings dict from frontend

        Returns:
            ObjectId: ID of created/updated document
        """
        if isinstance(tenant_id, str):
            tenant_id = ObjectId(tenant_id)

        return self.save_settings_for_tenant(
            tenant_id=tenant_id,
            theme_name=theme_name,
            settings=settings_payload,
            style_settings=style_settings_payload,
        )

    def get_effective_settings(self, theme_name, tenant_id):
        """
        Get effective settings for a theme by merging defaults with tenant customizations.

        Merge order: theme defaults ← tenant customizations (tenant wins)

        Args:
            theme_name: Theme name string
            tenant_id: Tenant ObjectId or string

        Returns:
            dict: Merged settings (theme defaults + tenant customizations)
        """
        if isinstance(tenant_id, str):
            tenant_id = ObjectId(tenant_id)

        themes_service = get_resource_service("themes")
        theme = themes_service.find_one(req=None, name=theme_name)

        if not theme:
            return {}

        defaults = themes_service.get_default_settings(theme)
        tenant_settings = self.get_settings_for_tenant(tenant_id, theme_name)

        effective = defaults.copy()
        effective.update(tenant_settings)

        return effective

    def get_effective_style_settings(self, theme_name, tenant_id):
        """
        Get effective style settings for a theme by merging defaults with tenant customizations.

        Merge order: theme default styleSettings ← tenant style customizations (tenant wins)

        Args:
            theme_name: Theme name string
            tenant_id: Tenant ObjectId or string

        Returns:
            dict: Merged style settings (theme defaults + tenant customizations)
        """
        if isinstance(tenant_id, str):
            tenant_id = ObjectId(tenant_id)

        themes_service = get_resource_service("themes")
        theme = themes_service.find_one(req=None, name=theme_name)

        if not theme:
            return {}

        defaults = themes_service.get_default_style_settings(theme)
        tenant_style_settings = self.get_style_settings_for_tenant(
            tenant_id, theme_name
        )

        effective = defaults.copy()

        for group_name, group_settings in tenant_style_settings.items():
            if group_name in effective:
                effective[group_name].update(group_settings)
            else:
                effective[group_name] = group_settings

        return effective

    def get_settings_for_blog(self, blog, theme_name):
        """
        Get effective theme settings for blog rendering.

        Uses tenant customizations merged with theme defaults.

        Args:
            blog: Blog document with tenant_id (required)
            theme_name: Name of the theme

        Returns:
            dict: Effective settings (defaults + tenant customizations)

        Raises:
            SuperdeskApiError: If blog is missing tenant_id
        """
        from superdesk.errors import SuperdeskApiError

        tenant_id = blog.get("tenant_id")

        if not tenant_id:
            raise SuperdeskApiError.badRequestError(
                message="Blog missing tenant_id - data integrity issue"
            )

        return self.get_effective_settings(theme_name, tenant_id)
