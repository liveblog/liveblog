import flask
import superdesk

from liveblog.auth.token_auth import (
    get_authenticated_user_from_context,
    get_request_auth_token,
    hydrate_request_context_from_token,
)

from .endpoints import billing_blueprint
from . import service


# Paths excluded from billing enforcement — must remain accessible
# regardless of subscription status.
# TODO: Prefix matching is convenient but brittle: new routes can be
# unintentionally exempted if they share one of these prefixes.
# Consider switching to explicit endpoint/blueprint allowlisting.
BILLING_EXEMPT_PREFIXES = (
    "/api/billing/",
    "/api/auth_db",
    "/api/auth",
    "/api/register",
    "/api/prepopulate",
    "/api/client_",
    "/api/syndication/webhook",
)


def _check_billing_gate():
    """Block mutating requests for tenants without an active subscription.

    Registered as an app-level before_request hook so it applies to both
    Eve resources and custom Flask blueprints.

    Raises SuperdeskApiError(403) with a _billing payload so the
    frontend interceptor can show a subscription prompt.
    """
    if flask.request.method not in {"POST", "PUT", "PATCH", "DELETE"}:
        return

    if not flask.current_app.config.get("STRIPE_BILLING_REQUIRED"):
        return

    path = flask.request.path
    if any(path.startswith(prefix) for prefix in BILLING_EXEMPT_PREFIXES):
        return

    user = get_authenticated_user_from_context()
    if not user:
        user = hydrate_request_context_from_token(
            get_request_auth_token(),
            method=flask.request.method,
            touch_session=False,
        )
    if not user or not user.get("tenant_id"):
        return

    from liveblog.tenancy import get_tenant

    tenant = get_tenant(required=False)
    if not tenant:
        return

    state = service.get_billing_state(tenant)
    if not state["access_allowed"]:
        from superdesk.errors import SuperdeskApiError

        raise SuperdeskApiError.forbiddenError(
            message="Active subscription required",
            payload={
                "billing_error": "SUBSCRIPTION_REQUIRED",
                "redirect": state["redirect"],
                "status": state["status"],
            },
        )


def init_app(app):
    app.register_blueprint(billing_blueprint)
    app.before_request(_check_billing_gate)


superdesk.privilege(
    name="billing",
    label="Billing",
    description="Manage billing and subscriptions",
)
