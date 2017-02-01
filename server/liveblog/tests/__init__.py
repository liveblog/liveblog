from superdesk import get_resource_service
from superdesk.tests import set_placeholder


test_consumer = {
    'name': 'Consumer 1',
    'contacts': [
        {'first_name': 'Foo', 'last_name': 'Bar', 'email': 'foo@bar.tld', 'phone': '+49123456789'}
    ],
    'api_key': '6498d72ee813b0c91a02b16d8ff856ff2c361f93'
}


def add_consumer_auth_context(context, api_key, consumer, auth_id=None):
    context.headers = [
        ('Content-Type', 'application/json'),
        ('Origin', 'localhost'),
        ('Authorization', api_key),
    ]

    if hasattr(context, 'consumer'):
        context.previous_consumer = context.consumer

    context.consumer = consumer

    set_placeholder(context, 'CONTEXT_CONSUMER_ID', str(consumer.get('_id')))
    set_placeholder(context, 'CONTEXT_CONSUMER_API_KEY', api_key)
    set_placeholder(context, 'AUTH_ID', str(auth_id))


def setup_auth_consumer(context, consumer):
    """ Setup the consumer for the api_key authentication.
    :param context: test context
    :param dict consumer: consumer
    """
    consumer = consumer or test_consumer
    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        api_key = consumer['api_key']

        if not get_resource_service('consumers').find_one(api_key=api_key, req=None):
            get_resource_service('consumers').post([consumer])

        add_consumer_auth_context(context, api_key, consumer)


# TODO: Setup blog auth token
