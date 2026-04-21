"""
Billing service — business logic for subscription management.

Handles subscription state resolution, tenant updates from Stripe events,
and billing status checks for access gating.
"""
import logging
import stripe

from bson import ObjectId
from superdesk import get_resource_service
from settings import STRIPE_BILLABLE_LEVELS

logger = logging.getLogger(__name__)

VALID_LEVELS = STRIPE_BILLABLE_LEVELS

# Subscription statuses that allow full access to the app.
ACTIVE_STATUSES = {"active", "trialing", "past_due"}

# Statuses where the user has a Stripe relationship but needs
# to fix payment — redirect to Customer Portal.
RECOVERABLE_STATUSES = {"incomplete", "unpaid", "paused"}

# Terminal statuses — subscription is gone.
TERMINAL_STATUSES = {"canceled", "incomplete_expired"}


def _ensure_object_id(id_value):
    """Ensure an ID is a BSON ObjectId.

    Elasticsearch returns _id as a string, but MongoDB requires ObjectId
    for update queries to match documents. Without this conversion,
    system_update silently no-ops (zero documents matched).
    """
    if isinstance(id_value, ObjectId):
        return id_value
    return ObjectId(id_value)


def get_subscription_level(subscription):
    """Extract subscription level from a Stripe Subscription object.

    Reads the `subscription_level` metadata key from the Product
    attached to the first line item. Returns None if not found
    or not a valid level.
    """
    items = subscription.get("items", {}).get("data", [])
    if not items:
        return None

    product = items[0].get("price", {}).get("product", {})

    if isinstance(product, dict):
        metadata = product.get("metadata", {})
    else:
        product_obj = stripe.Product.retrieve(product)
        metadata = product_obj.get("metadata", {})

    level = metadata.get("subscription_level")
    if level and level not in VALID_LEVELS:
        logger.warning("Invalid subscription_level '%s' in product metadata", level)
        return None
    return level


def find_tenant_by_customer(customer_id):
    """Find a tenant by Stripe customer ID. Returns None if not found."""
    return get_resource_service("tenants").find_one(
        req=None, stripe_customer_id=customer_id
    )


def update_tenant_subscription(tenant_id, subscription):
    """Update a tenant's subscription fields from a Stripe Subscription."""
    level = get_subscription_level(subscription)
    status = subscription.get("status")

    updates = {
        "stripe_subscription_id": subscription.get("id"),
        "stripe_subscription_status": status,
    }
    if level:
        updates["subscription_level"] = level

    tenant_id = _ensure_object_id(tenant_id)
    tenants_service = get_resource_service("tenants")
    tenant = tenants_service.find_one(req=None, _id=tenant_id)
    tenants_service.system_update(tenant_id, updates, tenant)
    logger.info(
        "Tenant %s subscription updated: level=%s status=%s",
        tenant_id,
        level,
        status,
    )


def reset_tenant_subscription(tenant_id):
    """Reset a tenant to solo after subscription deletion."""
    tenant_id = _ensure_object_id(tenant_id)
    tenants_service = get_resource_service("tenants")
    tenant = tenants_service.find_one(req=None, _id=tenant_id)
    tenants_service.system_update(
        tenant_id,
        {
            "subscription_level": "solo",
            "stripe_subscription_id": None,
            "stripe_subscription_status": "canceled",
        },
        tenant,
    )
    logger.info("Tenant %s subscription reset to solo", tenant_id)


def sync_subscription_from_stripe(tenant):
    """Fetch the latest subscription from Stripe and sync to tenant.

    Safety net for missed webhooks. Only calls Stripe when the tenant
    has a customer but subscription data is missing or stale.
    Returns the updated tenant dict.
    """
    customer_id = tenant.get("stripe_customer_id")
    if not customer_id:
        return tenant

    sub_id = tenant.get("stripe_subscription_id")
    sub_status = tenant.get("stripe_subscription_status")

    needs_sync = (not sub_id and not sub_status) or sub_status in TERMINAL_STATUSES
    if not needs_sync:
        return tenant

    try:
        from flask import current_app

        stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
        if not stripe.api_key:
            return tenant

        subs = stripe.Subscription.list(customer=customer_id, limit=1)
        if subs.data:
            update_tenant_subscription(tenant["_id"], subs.data[0])
            tenant["stripe_subscription_id"] = subs.data[0].id
            tenant["stripe_subscription_status"] = subs.data[0].status
            level = get_subscription_level(subs.data[0])
            if level:
                tenant["subscription_level"] = level
            logger.info(
                "Synced subscription %s from Stripe for tenant %s",
                subs.data[0].id,
                tenant["_id"],
            )
    except stripe.error.StripeError as e:
        logger.warning("Failed to sync subscription from Stripe: %s", e)

    return tenant


def ensure_stripe_customer(tenant, user_email="", tenant_name=""):
    """Ensure the tenant has a Stripe Customer, creating one if needed.

    Returns (customer_id, error_message). If error_message is not None,
    the caller should return it as an API error.
    """
    if tenant.get("stripe_customer_id"):
        return tenant["stripe_customer_id"], None

    from flask import current_app

    stripe.api_key = current_app.config.get("STRIPE_SECRET_KEY")
    if not stripe.api_key:
        return None, "Billing not configured"

    try:
        customer = stripe.Customer.create(
            email=user_email,
            name=tenant_name or tenant.get("name", ""),
            metadata={"tenant_id": str(tenant["_id"])},
        )
        tenant_id = _ensure_object_id(tenant["_id"])
        get_resource_service("tenants").system_update(
            tenant_id,
            {"stripe_customer_id": customer.id},
            tenant,
        )
        tenant["stripe_customer_id"] = customer.id
        logger.info(
            "Created Stripe customer %s for tenant %s",
            customer.id,
            tenant["_id"],
        )
        return customer.id, None
    except stripe.error.StripeError as e:
        logger.error("Failed to create Stripe customer: %s", e)
        return None, "Unable to set up billing. Please try again."


def get_billing_state(tenant):
    """Determine the billing state for a tenant.

    Returns a dict with:
        - access_allowed (bool): whether the tenant can use the app
        - redirect (str|None): "pricing", "portal", or None
        - status (str|None): the Stripe subscription status
    """
    if not tenant:
        return {
            "access_allowed": False,
            "redirect": "pricing",
            "status": None,
        }

    sub_status = tenant.get("stripe_subscription_status")
    sub_id = tenant.get("stripe_subscription_id")

    # Never subscribed
    if not sub_id and not sub_status:
        return {
            "access_allowed": False,
            "redirect": "pricing",
            "status": None,
        }

    # Healthy subscription
    if sub_status in ACTIVE_STATUSES:
        return {
            "access_allowed": True,
            "redirect": None,
            "status": sub_status,
        }

    # Payment issue — fixable via Customer Portal
    if sub_status in RECOVERABLE_STATUSES:
        return {
            "access_allowed": False,
            "redirect": "portal",
            "status": sub_status,
        }

    # Cancelled or expired — need to resubscribe
    return {
        "access_allowed": False,
        "redirect": "pricing",
        "status": sub_status,
    }
