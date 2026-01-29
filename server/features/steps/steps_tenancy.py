from behave import when, then
from flask import json
from superdesk.tests import set_placeholder


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
