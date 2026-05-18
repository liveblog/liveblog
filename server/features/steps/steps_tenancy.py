import os

from behave import given, when, then
from flask import json
from superdesk.tests import set_placeholder, get_prefixed_url
from superdesk.tests.steps import apply_placeholders


@given("instance settings are initialized")
def step_initialize_instance_settings(context):
    """Load the real default instance settings fixture into the test database."""
    from superdesk import get_resource_service

    settings_path = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "liveblog",
            "prepopulate",
            "data_init",
            "instance_settings.json",
        )
    )

    with open(settings_path) as settings_file:
        settings_data = json.load(settings_file)

    with context.app.app_context():
        service = get_resource_service("instance_settings")
        original_initialize_data = getattr(context.app, "is_initialize_data", False)

        context.app.is_initialize_data = True
        try:
            if not service.get_existing_config():
                service.post(settings_data)

            context.app.features.load_settings()
        finally:
            context.app.is_initialize_data = original_initialize_data


@given('current tenant subscription level is "{subscription_level}"')
def step_set_current_tenant_subscription_level(context, subscription_level):
    """Update the current tenant document with the requested subscription level."""
    from bson import ObjectId
    from superdesk import get_resource_service

    assert hasattr(
        context, "current_tenant"
    ), "No current tenant set. Use 'Given a tenant' first."

    tenant_id = context.current_tenant["_id"]
    if isinstance(tenant_id, str):
        tenant_id = ObjectId(tenant_id)

    with context.app.app_context():
        get_resource_service("tenants").patch(
            tenant_id, {"subscription_level": subscription_level}
        )

    context.current_tenant["subscription_level"] = subscription_level


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


def _get_response_field(context, field_path):
    data = json.loads(context.response.get_data())
    value = data

    for part in field_path.split("."):
        assert isinstance(value, dict), (
            f"Cannot resolve '{field_path}': '{part}' is nested under "
            f"a non-object value: {value}"
        )
        assert part in value, f"Field '{field_path}' not found in response: {data}"
        value = value[part]

    return value, data


@then('response field "{field_path}" is true')
def step_response_field_is_true(context, field_path):
    value, data = _get_response_field(context, field_path)
    assert value is True, f"Expected '{field_path}' to be true, got {value}: {data}"


@then('response field "{field_path}" is false')
def step_response_field_is_false(context, field_path):
    value, data = _get_response_field(context, field_path)
    assert value is False, f"Expected '{field_path}' to be false, got {value}: {data}"


@then('response field "{field_path}" is {expected:d}')
def step_response_field_is_int(context, field_path, expected):
    value, data = _get_response_field(context, field_path)
    assert isinstance(value, int) and not isinstance(value, bool), (
        f"Expected '{field_path}' to be an integer, got {value}: {data}"
    )
    assert (
        value == expected
    ), f"Expected '{field_path}' to be {expected}, got {value}: {data}"


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
    If IF_MATCH_VALUE placeholder is set, it will be used for the If-Match header.
    """
    url = apply_placeholders(context, url)

    # Build headers starting with auth headers from context
    headers = list(context.headers) if hasattr(context, "headers") else []
    headers.append(("Content-Type", "application/json"))

    # Add If-Match header only if IF_MATCH_VALUE placeholder is set
    if hasattr(context, "placeholders") and "IF_MATCH_VALUE" in context.placeholders:
        headers.append(("If-Match", context.placeholders["IF_MATCH_VALUE"]))

    full_url = get_prefixed_url(context.app, url)
    context.response = context.client.delete(full_url, headers=headers)
