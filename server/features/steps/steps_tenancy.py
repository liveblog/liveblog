from behave import when, then
from flask import json
from superdesk.tests import set_placeholder, get_prefixed_url
from superdesk.tests.steps import apply_placeholders


@when('we save "{key}" from last response "{field}"')
def step_save_from_response(context, key, field):
    """Save a field from the last response for later use."""
    assert context.response, "No response available"
    data = json.loads(context.response.get_data())
    value = data.get(field)
    assert value, f"Field '{field}' not found in response"
    set_placeholder(context, key, str(value))


@then('response has key "{key}"')
def step_check_key_in_response(context, key):
    """Check that a key exists in JSON response."""
    data = json.loads(context.response.get_data())
    assert key in data, f"Key '{key}' not found in response: {data}"


@when('we attempt to patch "{url}"')
def step_attempt_patch_cross_tenant(context, url):
    """
    Attempt to PATCH a resource without pre-fetching it.

    Used for testing cross-tenant scenarios where GET would fail.
    If IF_MATCH_VALUE placeholder is set, it will be used for the If-Match header.
    """
    url = apply_placeholders(context, url)
    data = apply_placeholders(context, context.text)

    # Build headers starting with auth headers from context
    headers = list(context.headers) if hasattr(context, "headers") else []
    headers.append(("Content-Type", "application/json"))

    # Add If-Match header only if IF_MATCH_VALUE placeholder is set
    if hasattr(context, "placeholders") and "IF_MATCH_VALUE" in context.placeholders:
        headers.append(("If-Match", context.placeholders["IF_MATCH_VALUE"]))

    full_url = get_prefixed_url(context.app, url)
    context.response = context.client.patch(full_url, data=data, headers=headers)


@when('we attempt to delete "{url}"')
def step_attempt_delete_cross_tenant(context, url):
    """
    Attempt to DELETE a resource without pre-fetching it.

    Used for testing cross-tenant scenarios where GET would fail.
    """
    url = apply_placeholders(context, url)

    # Build headers starting with auth headers from context
    headers = list(context.headers) if hasattr(context, "headers") else []
    headers.append(("Content-Type", "application/json"))

    full_url = get_prefixed_url(context.app, url)
    context.response = context.client.delete(full_url, headers=headers)
