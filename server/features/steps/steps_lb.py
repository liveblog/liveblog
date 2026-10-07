import json

from behave import given, then, when
from superdesk.tests import set_placeholder
from superdesk.tests.steps import (
    apply_placeholders,
    post_data,
    when_we_get_url,
)


def _anonymous(context, step, url):
    """Run a request step with the Authorization header removed, like a public embed."""
    headers = context.headers
    context.headers = [h for h in headers if h[0].lower() != "authorization"]
    try:
        step(context, url)
    finally:
        context.headers = headers


@when('we post anonymously to "{url}"')
def step_post_anonymously(context, url):
    _anonymous(context, post_data, url)


@when('we get anonymously "{url}"')
def step_get_anonymously(context, url):
    _anonymous(context, when_we_get_url, url)


@given('we save the current tenant id as "{name}"')
def step_save_tenant_id(context, name):
    set_placeholder(context, name, context.current_tenant["_id"])


@given('we save the id of user "{username}" as "{name}"')
def step_save_user_id(context, username, name):
    set_placeholder(context, name, context.test_users[username]["_id"])


@then('archive document "{doc_id}" belongs to tenant "{tenant_id}"')
def step_archive_doc_tenant(context, doc_id, tenant_id):
    doc = _raw_archive_doc(context, doc_id)
    expected = apply_placeholders(context, tenant_id)
    assert str(doc.get("tenant_id")) == expected, "tenant_id is {}, expected {}".format(
        doc.get("tenant_id"), expected
    )


def _raw_archive_doc(context, doc_id):
    doc_id = apply_placeholders(context, doc_id)
    with context.app.app_context():
        doc = context.app.data.find_one_raw("archive", doc_id)
    assert doc, "archive document {} not found".format(doc_id)
    return doc


@then('archive document "{doc_id}" has no field "{field}"')
def step_archive_doc_has_no_field(context, doc_id, field):
    doc = _raw_archive_doc(context, doc_id)
    assert field not in doc, "{} is {!r}".format(field, doc[field])


@given('archive document "{doc_id}" has the raw groups')
def step_set_raw_groups(context, doc_id):
    """Store `groups` straight into the database, bypassing service validation."""
    doc = _raw_archive_doc(context, doc_id)
    groups = json.loads(apply_placeholders(context, context.text))
    with context.app.test_request_context(context.app.config["URL_PREFIX"]):
        context.app.data.update("archive", doc["_id"], {"groups": groups}, doc)


@then('the response does not contain "{text}"')
def step_response_does_not_contain(context, text):
    text = apply_placeholders(context, text)
    body = context.response.get_data(as_text=True)
    assert text not in body, "{!r} found in response: {}".format(text, body)
