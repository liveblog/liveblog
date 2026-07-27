from behave import given, when, then
from bson import ObjectId
from flask import json

from superdesk import get_resource_service
from superdesk.tests import get_prefixed_url
from superdesk.tests.steps import apply_placeholders


def _get_current_tenant(context):
    tenant_id = getattr(context, "user", {}).get("tenant_id")
    assert tenant_id, "No authenticated tenant found in context"
    with context.app.app_context():
        if isinstance(tenant_id, str) and ObjectId.is_valid(tenant_id):
            tenant_id = ObjectId(tenant_id)
        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
    assert tenant, "Current tenant not found"
    return tenant


@given("billing is required")
def step_billing_is_required(context):
    context.app.config["STRIPE_BILLING_REQUIRED"] = True


@given("billing is not configured")
def step_billing_is_not_configured(context):
    context.app.config["STRIPE_SECRET_KEY"] = None
    context.app.config["STRIPE_WEBHOOK_SECRET"] = None


@given("current tenant has no subscription")
def step_current_tenant_has_no_subscription(context):
    tenant = _get_current_tenant(context)
    with context.app.app_context():
        get_resource_service("tenants").patch(
            tenant["_id"],
            {
                "stripe_customer_id": None,
                "stripe_subscription_id": None,
                "stripe_subscription_status": None,
            },
        )


@given("current tenant has an active subscription")
def step_current_tenant_has_active_subscription(context):
    tenant = _get_current_tenant(context)
    with context.app.app_context():
        get_resource_service("tenants").patch(
            tenant["_id"],
            {
                "stripe_customer_id": "cus_behave_123",
                "stripe_subscription_id": "sub_behave_123",
                "stripe_subscription_status": "active",
            },
        )


@then('response has billing error "{error_code}"')
def step_response_has_billing_error(context, error_code):
    data = json.loads(context.response.get_data())
    issues = data.get("_issues", {})
    assert (
        issues.get("billing_error") == error_code
    ), f"Expected billing_error={error_code}, got {issues}"


@when('we post raw to "{url}"')
def step_post_raw_to_url(context, url):
    data = apply_placeholders(context, context.text)
    url = apply_placeholders(context, url)
    context.response = context.client.post(
        get_prefixed_url(context.app, url),
        data=data,
        headers=context.headers,
    )
