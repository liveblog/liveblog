from behave import then, given, when
from eve.methods.common import parse
from liveblog import tests
from unittest.mock import patch
from superdesk import get_resource_service
from superdesk.tests.steps import (json, apply_placeholders, is_user_resource, get_prefixed_url, set_user_default,
                                   store_placeholder)


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


@then('we get "{producer_id}" blogs from producer blogs endpoint')
def then_we_get_producer_blogs(context, producer_id):
    blog_service = get_resource_service('blogs')
    producer_service = get_resource_service('producers')

    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        producer = producer_service.find_one(_id=producer_id, req=None)
        blogs = list(blog_service.find(where={'syndication_enabled': True}))

        with patch('liveblog.syndication.producer.ProducerService.get_blogs') as mock_get_blogs:
            mock_get_blogs.return_value = blogs
            producer_blogs = producer_service.get_blogs(producer)

        def _ids(items):
            return [i['_id'] for i in items]

        assert _ids(blogs) == _ids(producer_blogs)


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


@given('"{resource}" as item list')
def step_impl_given_resource_as_item_list(context, resource):
    # TODO: Add as contribution to superdesk-core.
    data = apply_placeholders(context, context.text)
    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        if not is_user_resource(resource):
            get_resource_service(resource).delete_action()

        items = [parse(item, resource) for item in json.loads(data)]
        if is_user_resource(resource):
            for item in items:
                item.setdefault('needs_activation', False)

        get_resource_service(resource).post(items)
        context.data = items
        context.resource = resource
        for i, item in enumerate(items):
            setattr(context, '{}[{}]'.format(resource, i), item)


@when('we patch to "{url}"')
def step_impl_when_patch_url(context, url):
    with context.app.mail.record_messages() as outbox:
        data = apply_placeholders(context, context.text)
        url = apply_placeholders(context, url)
        set_user_default(url, data)
        context.response = context.client.patch(get_prefixed_url(context.app, url),
                                                data=data, headers=context.headers)

        item = json.loads(context.response.get_data())
        context.outbox = outbox
        store_placeholder(context, url)
        return item
