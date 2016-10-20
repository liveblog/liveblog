from behave import then, given
from eve.methods.common import parse
from liveblog import tests
from superdesk import get_resource_service
from superdesk.tests.steps import json, apply_placeholders


@given('config consumer api_key')
def step_impl_given_config(context):
    tests.setup_auth_consumer(context, tests.test_consumer)


def _test_list_response(resource_name, context, key='name'):
    names = json.loads(context.text)
    names.sort()
    response_consumers = json.loads(context.response.get_data())['_items']
    response_names = [r[key] for r in response_consumers]
    response_names.sort()
    assert names == response_names, '{} should be {}, but it was {}'.format(resource_name, names, response_names)


@then('we get consumers')
def then_we_get_consumers(context):
    return _test_list_response('consumers', context)


@then('we get producers')
def then_we_get_consumers(context):
    return _test_list_response('producers', context)


@given('"{resource}" as consumer')
def step_impl_given_(context, resource):
    tests.setup_auth_consumer(context, tests.test_consumer)
    data = apply_placeholders(context, context.text)
    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        items = [parse(item, resource) for item in json.loads(data)]
        get_resource_service(resource).post(items)
        context.data = items
        context.resource = resource
        setattr(context, resource, items[-1])
