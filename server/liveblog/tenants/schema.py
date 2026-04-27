"""
Schema definition for the tenants resource.

Tenants represent isolated workspaces in the multi-tenant LiveBlog system.
Each tenant has its own isolated set of blogs, posts, items, and other
resources.

NOTE: Consider adding a `status` field to the tenant lifecycle:

    "status": {
        "type": "string",
        "allowed": ["pending", "active", "suspended", "deactivated"],
        "default": "pending",
    }

This would unify multiple concerns into a single state machine:

    pending      -> Registration complete, no active subscription yet.
                    Tenant exists but access is limited.
                    Transitions to "active" when Stripe subscription
                    reaches "active" or "trialing" status.

    active       -> Subscription is healthy, full access.
                    This is where the tenant spends most of its life.

    suspended    -> Payment issue (Stripe: past_due, unpaid, incomplete).
                    Access could be read-only or blocked, with a banner
                    prompting the user to fix payment via Customer Portal.
                    Transitions back to "active" when payment is resolved,
                    or to "deactivated" after a grace period.

    deactivated  -> Subscription cancelled or expired.
                    Access fully blocked. Data retained for a configurable
                    period before permanent deletion.

Benefits:
- Server-side billing enforcement (the TODO in billing/__init__.py)
  becomes a simple check: tenant.status != "active" -> 403.
- Decouples billing state from access control — the status field is
  the single source of truth for "can this tenant use the app?"
- Stripe webhook handlers just update status based on subscription
  events, and all enforcement reads from status.
- Supports non-Stripe scenarios: admin can manually suspend a tenant,
  or a tenant can be deactivated for ToS violations.
- The FeaturesService can use status to further restrict features
  (e.g., suspended tenants get read-only access).
"""
from settings import SUBSCRIPTION_LEVELS

tenants_schema = {
    "name": {
        "type": "string",
        "required": True,
        "minlength": 1,
        "maxlength": 100,
        "unique": False,
    },
    "organization_name": {
        "type": "string",
        "maxlength": 200,
        "nullable": True,
    },
    "subscription_level": {
        "type": "string",
        "allowed": SUBSCRIPTION_LEVELS,
        "default": "solo",
    },
    "settings": {"type": "dict", "mapping": {"type": "object", "enabled": False}},
    "owner_user_id": {
        "type": "objectid",
        "nullable": True,
        "data_relation": {"resource": "users", "field": "_id"},
    },
    "stripe_customer_id": {
        "type": "string",
        "nullable": True,
    },
    "stripe_subscription_id": {
        "type": "string",
        "nullable": True,
    },
    "stripe_subscription_status": {
        "type": "string",
        "nullable": True,
        "allowed": [
            None,
            "active",
            "trialing",
            "past_due",
            "canceled",
            "unpaid",
            "incomplete",
            "incomplete_expired",
            "paused",
        ],
    },
}
