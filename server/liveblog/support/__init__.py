"""
Support tools for the multi-tenant LiveBlog deployment.

Exposes endpoints, restricted to `is_support` users, to list tenants and
their users and to impersonate a tenant user for debugging customer issues.
"""

from .impersonation import support_blueprint


def init_app(app):
    app.register_blueprint(support_blueprint)
