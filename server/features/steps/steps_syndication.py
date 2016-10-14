from behave import then
from superdesk.tests.steps import json


@then('we get consumers')
def then_we_get_consumers(context):
    names = json.loads(context.text)
    names.sort()
    response_consumers = json.loads(context.response.get_data())['_items']
    response_names = [r['name'] for r in response_consumers]
    response_names.sort()
    assert names == response_names, 'consumers should be {}, but it was {}'.format(names, response_names)
