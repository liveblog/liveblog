import superdesk
from apps.auth import AuthResource
from apps.auth.service import AuthService
from liveblog.auth.db import AccessAuthService
from liveblog.auth.token_auth import LiveBlogTokenAuth, is_support_user  # noqa: F401
from .reset_password import LiveBlogResetPasswordService

from apps.auth.db.reset_password import ResetPasswordResource, ActiveTokensResource
from apps.auth.db.change_password import ChangePasswordService, ChangePasswordResource


class LiveBlogAuthResource(AuthResource):
    """Auth resource extended with an audit stamp for impersonation sessions.

    `impersonated_by` holds the support user id when the session was created
    through POST /api/support/impersonate, making impersonation sessions
    queryable in the auth collection.
    """

    schema = dict(
        AuthResource.schema,
        impersonated_by={"type": "objectid", "nullable": True},
    )

    # A fresh datasource dict is required: Eve stores the computed projection
    # inside the resource class datasource on first registration, so reusing
    # the parent's dict would keep a projection without `impersonated_by`
    datasource = {"source": "auth"}


def init_app(app):
    # Override the default SuperdeskTokenAuth with tenant-aware LiveBlogTokenAuth
    # This is called after apps.auth.init_app(), so it replaces the auth instance
    app.auth = LiveBlogTokenAuth()

    # Re-register the core auth endpoint with the extended resource, otherwise
    # Eve's schema-based projection strips `impersonated_by` from every read
    # done through get_resource_service("auth")
    endpoint_name = "auth"
    service = AuthService(endpoint_name, backend=superdesk.get_backend())
    LiveBlogAuthResource(endpoint_name, app=app, service=service)

    endpoint_name = "auth_db"
    service = AccessAuthService("auth", backend=superdesk.get_backend())
    LiveBlogAuthResource(endpoint_name, app=app, service=service)

    endpoint_name = "reset_user_password"
    service = LiveBlogResetPasswordService(
        endpoint_name, backend=superdesk.get_backend()
    )
    ResetPasswordResource(endpoint_name, app=app, service=service)

    endpoint_name = "change_user_password"
    service = ChangePasswordService(endpoint_name, backend=superdesk.get_backend())
    ChangePasswordResource(endpoint_name, app=app, service=service)

    endpoint_name = "active_tokens"
    service = superdesk.Service(endpoint_name, backend=superdesk.get_backend())
    ActiveTokensResource(endpoint_name, app=app, service=service)


superdesk.intrinsic_privilege("auth_db", method=["DELETE"])
