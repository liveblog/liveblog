"""
Stripe webhook receiver.

Verifies incoming webhook signatures and dispatches events
to the billing service for processing.
"""
import stripe
import logging

from flask import request, current_app as app

from liveblog.utils.api import api_error, api_response
from . import service

logger = logging.getLogger(__name__)


def _handle_subscription_event(event):
    """Handle subscription created or updated."""
    subscription = event["data"]["object"]
    customer_id = subscription.get("customer")
    logger.info(
        "Subscription event: customer=%s status=%s",
        customer_id,
        subscription.get("status"),
    )

    if not customer_id:
        logger.warning("Webhook event missing customer ID")
        return

    tenant = service.find_tenant_by_customer(customer_id)
    if not tenant:
        logger.warning("No tenant for Stripe customer %s", customer_id)
        return

    logger.info("Updating tenant %s", tenant["_id"])
    service.update_tenant_subscription(tenant["_id"], subscription)


def _handle_subscription_deleted(event):
    """Handle subscription cancellation."""
    subscription = event["data"]["object"]
    customer_id = subscription.get("customer")
    logger.info("Subscription deleted for customer %s", customer_id)

    if not customer_id:
        return

    tenant = service.find_tenant_by_customer(customer_id)
    logger.info("Found tenant: %s", tenant.get("_id") if tenant else None)
    if not tenant:
        logger.warning("No tenant for Stripe customer %s", customer_id)
        return

    service.reset_tenant_subscription(tenant["_id"])


def _handle_checkout_completed(event):
    """Handle one-time payment checkout for time-limited plans (e.g. Go).

    Skips subscription checkouts (handled by subscription event handlers).
    """
    session = event["data"]["object"]

    if session.get("mode") != "payment":
        return

    customer_id = session.get("customer")
    if not customer_id:
        logger.warning("Checkout session missing customer ID")
        return

    tenant = service.find_tenant_by_customer(customer_id)
    if not tenant:
        logger.warning("No tenant for Stripe customer %s", customer_id)
        return

    stripe.api_key = app.config.get("STRIPE_SECRET_KEY")

    # Retrieve the session with line items expanded to get product metadata
    try:
        session = stripe.checkout.Session.retrieve(
            session["id"], expand=["line_items.data.price.product"]
        )
    except stripe.error.StripeError as e:
        logger.error("Failed to retrieve checkout session: %s", e)
        return

    line_items = session.get("line_items", {}).get("data", [])
    if not line_items:
        return

    product = line_items[0].get("price", {}).get("product", {})
    metadata = product.get("metadata", {}) if isinstance(product, dict) else {}

    level = metadata.get("subscription_level")
    duration_days = service.get_plan_duration_days(metadata)

    if not level or not duration_days:
        return

    tenant_id = tenant["_id"]
    price_id = line_items[0].get("price", {}).get("id")
    tenants_service = service.get_resource_service("tenants")
    tenants_service.system_update(
        service._ensure_object_id(tenant_id),
        {"subscription_level": level, "plan_price_id": price_id},
        tenant,
    )
    service.set_plan_expiry(tenant_id, duration_days)
    logger.info(
        "Go plan activated for tenant %s: level=%s, duration=%d days",
        tenant_id,
        level,
        duration_days,
    )


EVENT_HANDLERS = {
    "customer.subscription.created": _handle_subscription_event,
    "customer.subscription.updated": _handle_subscription_event,
    "customer.subscription.deleted": _handle_subscription_deleted,
    "checkout.session.completed": _handle_checkout_completed,
}


def handle_webhook():
    """Receive and process Stripe webhook events."""
    stripe.api_key = app.config.get("STRIPE_SECRET_KEY")
    webhook_secret = app.config.get("STRIPE_WEBHOOK_SECRET")
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured")
        return api_error("Webhook not configured", 500)

    payload = request.get_data()
    sig_header = request.headers.get("Stripe-Signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except ValueError:
        return api_error("Invalid payload", 400)
    except stripe.error.SignatureVerificationError:
        return api_error("Invalid signature", 400)

    event_type = event.get("type")
    handler = EVENT_HANDLERS.get(event_type)

    if handler:
        try:
            handler(event)
        except Exception:
            logger.exception("Error handling Stripe event %s", event_type)
            return api_error("Webhook handler error", 500)
    else:
        logger.debug("Ignoring Stripe event: %s", event_type)

    return api_response({"received": True}, 200)
