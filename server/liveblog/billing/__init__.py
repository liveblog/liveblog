import flask
import superdesk

from .endpoints import billing_blueprint
from . import service


# Paths excluded from billing enforcement — must remain accessible
# regardless of subscription status.
BILLING_EXEMPT_PREFIXES = (
    "/api/billing/",
    "/api/auth_db",
    "/api/auth",
    "/api/register",
    "/api/prepopulate",
    "/api/client_",
    "/api/syndication/webhook",
)


def _check_billing_gate(resource, request=None, lookup=None):
    """Block write operations for tenants without an active subscription.

    Registered on Eve's on_pre_POST/PATCH/PUT/DELETE hooks, which fire
    after authentication — flask.g.user is guaranteed to be set.

    Raises SuperdeskApiError(403) with a _billing payload so the
    frontend interceptor can show a subscription prompt.
    """
    if not flask.current_app.config.get("STRIPE_BILLING_REQUIRED"):
        return

    path = flask.request.path
    if any(path.startswith(prefix) for prefix in BILLING_EXEMPT_PREFIXES):
        return

    user = flask.g.get("user")
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

    app.on_pre_POST += _check_billing_gate
    app.on_pre_PATCH += _check_billing_gate
    app.on_pre_PUT += _check_billing_gate
    app.on_pre_DELETE += _check_billing_gate


superdesk.privilege(
    name="billing",
    label="Billing",
    description="Manage billing and subscriptions",
)
