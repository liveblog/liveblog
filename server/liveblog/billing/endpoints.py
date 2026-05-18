"""
Billing API endpoints.

Provides HTTP endpoints for billing status, Stripe Checkout,
Customer Portal, and webhook reception.
"""
import json
import flask
import logging
import stripe

from flask import Blueprint, abort, request, current_app as app
from flask_cors import CORS

from liveblog.auth.token_auth import (
    get_authenticated_user_from_context,
    get_request_auth_token,
    hydrate_request_context_from_token,
)
from liveblog.tenancy import get_tenant
from liveblog.utils.api import api_error, api_response

from . import service
from .webhooks import handle_webhook

logger = logging.getLogger(__name__)
billing_blueprint = Blueprint("billing", __name__)
CORS(billing_blueprint)


def _billing_auth():
    """Require auth for all endpoints except webhook and config.

    /webhook — verified by Stripe signature, not user auth.
    /config — public, returns only global config flags (no tenant data).
    All other endpoints require authenticated user.
    """
    public_suffixes = ("/webhook", "/config", "/plan-info")
    if any(request.path.endswith(s) for s in public_suffixes):
        return

    user = get_authenticated_user_from_context()
    if not user:
        user = hydrate_request_context_from_token(
            get_request_auth_token(),
            method=request.method,
            touch_session=True,
        )

    if not user:
        return abort(401, "Authorization failed.")


billing_blueprint.before_request(_billing_auth)


def _get_tenant_for_request():
    """Get the current tenant with a valid Stripe Customer.

    Creates a Stripe Customer lazily if the tenant doesn't have one.
    """
    tenant = get_tenant(required=False)
    if not tenant:
        return None, api_error("Authentication required", 401)

    user = flask.g.get("user", {})
    customer_id, error = service.ensure_stripe_customer(
        tenant,
        user_email=user.get("email", ""),
    )
    if error:
        return None, api_error(error, 500)

    return tenant, None


def _require_stripe():
    """Return the Stripe API key or an error response."""
    key = app.config.get("STRIPE_SECRET_KEY")

    if not key:
        return None, api_error("Billing not configured", 500)
    return key, None


@billing_blueprint.route("/api/billing/plan-info", methods=["GET"])
def plan_info():
    """Public endpoint returning product and price info for a given price_id.

    Used by the registration page to display a plan summary panel.
    """
    stripe_key, error = _require_stripe()
    if error:
        return error

    price_id = request.args.get("price_id")
    if not price_id:
        return api_error("price_id is required", 400)

    stripe.api_key = stripe_key

    try:
        price = stripe.Price.retrieve(price_id, expand=["product"])
    except stripe.error.StripeError:
        return api_error("Invalid price_id", 400)

    product = price.get("product", {})
    if not isinstance(product, dict):
        return api_error("Unable to resolve product", 400)

    metadata = product.get("metadata", {})
    level = metadata.get("subscription_level")
    if not level or level not in service.VALID_LEVELS:
        return api_error("Invalid plan", 400)

    recurring = price.get("recurring") or {}

    return api_response(
        {
            "productName": product.get("name", ""),
            "tagline": metadata.get(
                "tagline", "Everything you need to go live. Simple, no overhead."
            ),
            "subtitle": metadata.get(
                "subtitle",
                "Powerful tools for newsrooms and storytellers, included with your account.",
            ),
            "description": product.get("description", ""),
            "marketingFeatures": product.get("marketing_features", []),
            "price": {
                "amount": (price.get("unit_amount") or 0) / 100,
                "currency": price.get("currency", ""),
                "interval": recurring.get("interval"),
                "intervalCount": recurring.get("interval_count"),
            },
            "metadata": {
                "subscriptionLevel": level,
                "planDurationDays": metadata.get("plan_duration_days"),
            },
        },
        200,
    )


@billing_blueprint.route("/api/billing/config", methods=["GET"])
def billing_config():
    """Public endpoint returning global billing configuration.

    No tenant data exposed — safe for unauthenticated callers.
    Used by the register page to decide whether to redirect to pricing.
    """
    return api_response(
        {
            "billing_required": app.config.get("STRIPE_BILLING_REQUIRED", False),
            "pricing_url": app.config.get("STRIPE_PRICING_URL", ""),
        },
        200,
    )


@billing_blueprint.route("/api/billing/status", methods=["GET"])
def billing_status():
    """Authenticated endpoint returning tenant billing state.

    Used by the dashboard to gate access based on subscription status.
    """
    billing_required = app.config.get("STRIPE_BILLING_REQUIRED", False)

    if not billing_required:
        return api_response(
            {
                "billing_required": False,
                "access_allowed": True,
                "redirect": None,
                "status": None,
            },
            200,
        )

    tenant = get_tenant(required=True)
    tenant = service.sync_subscription_from_stripe(tenant)
    state = service.get_billing_state(tenant)

    response = {
        "billing_required": True,
        "access_allowed": state["access_allowed"],
        "redirect": state["redirect"],
        "status": state["status"],
        "pricing_url": app.config.get("STRIPE_PRICING_URL", ""),
        "plan_expires_at": state.get("plan_expires_at"),
    }

    if state["redirect"] == "extend":
        response["checkout_price_id"] = tenant.get("plan_price_id", "")

    return api_response(response, 200)


@billing_blueprint.route("/api/billing/checkout", methods=["POST"])
def create_checkout_session():
    """Create a Stripe Checkout session for subscribing to or purchasing a plan.

    Uses mode="payment" for time-limited plans (Go) and mode="subscription"
    for recurring plans (Solo, Team).

    Request body:
        {"price_id": "price_...", "return_url": "https://..."}
    """
    stripe_key, error = _require_stripe()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    price_id = data.get("price_id")
    return_url = data.get("return_url", request.host_url)

    if not price_id:
        return api_error("price_id is required", 400)

    tenant, error = _get_tenant_for_request()
    if error:
        return error

    stripe.api_key = stripe_key

    try:
        price = stripe.Price.retrieve(price_id, expand=["product"])
        product = price.get("product", {})
        metadata = product.get("metadata", {}) if isinstance(product, dict) else {}
        level = metadata.get("subscription_level")

        if not level or level not in service.VALID_LEVELS:
            return api_error("Invalid plan", 400)
    except stripe.error.StripeError:
        return api_error("Invalid price_id", 400)

    duration_days = service.get_plan_duration_days(metadata)
    is_one_time = duration_days is not None

    if is_one_time and service.is_time_limited_plan_active(tenant):
        return api_error("You already have an active plan", 400)

    try:
        checkout_mode = "payment" if is_one_time else "subscription"
        session_params = {
            "customer": tenant["stripe_customer_id"],
            "mode": checkout_mode,
            "line_items": [{"price": price_id, "quantity": 1}],
            "success_url": return_url,
            "cancel_url": return_url,
        }
        if is_one_time:
            session_params["invoice_creation"] = {"enabled": True}

        session = stripe.checkout.Session.create(**session_params)
        return api_response({"url": session.url}, 200)
    except stripe.error.StripeError as e:
        logger.error("Stripe Checkout error: %s", e)
        return api_error("Unable to create checkout session", 500)


@billing_blueprint.route("/api/billing/portal", methods=["POST"])
def create_portal_session():
    """Create a Stripe Customer Portal session.

    Request body (optional):
        {"return_url": "https://..."}
    """
    stripe_key, error = _require_stripe()
    if error:
        return error

    data = request.get_json(silent=True) or {}
    return_url = data.get("return_url", request.host_url)

    tenant, error = _get_tenant_for_request()
    if error:
        return error

    stripe.api_key = stripe_key
    try:
        session = stripe.billing_portal.Session.create(
            customer=tenant["stripe_customer_id"],
            return_url=return_url,
        )
        return api_response({"url": session.url}, 200)
    except stripe.error.StripeError as e:
        logger.error("Stripe Portal error: %s", e)
        return api_error("Unable to create portal session", 500)


@billing_blueprint.route("/api/billing/customer-session", methods=["POST"])
def create_customer_session():
    """Create a Stripe Customer Session for embedded components."""
    stripe_key, error = _require_stripe()
    if error:
        return error

    tenant, error = _get_tenant_for_request()
    if error:
        return error

    stripe.api_key = stripe_key
    # TODO: Replace with stripe.CustomerSession.create() once available in
    # our pinned stripe SDK version. The APIRequestor is an internal API
    # that may break on library upgrades.
    try:
        resp, _ = stripe.api_requestor.APIRequestor().request(
            "post",
            "/v1/customer_sessions",
            {
                "customer": tenant["stripe_customer_id"],
                "components[pricing_table][enabled]": "true",
            },
        )
        data = json.loads(resp.body)

        return api_response(
            {
                "client_secret": data["client_secret"],
            },
            200,
        )
    except stripe.error.StripeError as e:
        logger.error("Customer session error: %s", e)
        return api_error("Unable to create customer session", 500)


@billing_blueprint.route("/api/billing/webhook", methods=["POST"])
def stripe_webhook():
    """Receive Stripe webhook events."""
    return handle_webhook()
