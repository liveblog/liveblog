from behave import then
from superdesk.tests.steps import json


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
