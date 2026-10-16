"""
Theme Settings Module

This module manages tenant-specific customizations for themes.
Provides normalized storage for theme settings separate from theme metadata.

Collection: theme_settings
- One entry per theme per tenant
- Stores settings and style_settings overrides
- Unique constraint: (tenant_id, theme_name)

Settings Resolution Hierarchy:
1. Theme defaults (from themes.settings)
2. Tenant customizations (from theme_settings.settings)
3. Blog overrides (from blogs.theme_settings)
"""
import superdesk


def init_app(app):
    """Initialize theme_settings module"""
    from .theme_settings import ThemeSettingsResource, ThemeSettingsService

    endpoint_name = "theme_settings"
    service = ThemeSettingsService(endpoint_name, backend=superdesk.get_backend())
    ThemeSettingsResource(endpoint_name, app=app, service=service)
