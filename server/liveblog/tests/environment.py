import os

from apps.io.tests import setup_providers
from superdesk import tests
from superdesk.tests import setup_auth_user
from superdesk.tests.environment import setup_search_provider
from superdesk.vocabularies.command import VocabulariesPopulateCommand
from liveblog.tests import setup_auth_consumer, test_consumer
from .test_settings import DATE_FORMAT


def setup_before_scenario(context, scenario, config, app_factory):
    if scenario.status != 'skipped' and 'notesting' in scenario.tags:
        config['SUPERDESK_TESTING'] = False

    # TODO: Temp fix for DATE_FORMAT. This will be removed when superdesk will allow to specify custom test settings.
    config['DATE_FORMAT'] = DATE_FORMAT

    tests.setup(context, config, app_factory, bool(config))

    context.headers = [
        ('Content-Type', 'application/json'),
        ('Origin', 'localhost')
    ]

    if 'amazons3' in scenario.tags and not context.app.config.get('AMAZON_CONTAINER_NAME', None):
        scenario.mark_skipped()

    if 'alchemy' in scenario.tags and not context.app.config.get('KEYWORDS_KEY_API'):
        scenario.mark_skipped()

    if 'clean_snapshots' in scenario.tags:
        tests.use_snapshot.cache.clear()

    setup_search_provider(context.app)

    if scenario.status != 'skipped' and 'auth' in scenario.tags:
        setup_auth_user(context)

    if scenario.status != 'skipped' and 'consumer_auth' in scenario.tags:
        setup_auth_consumer(context, test_consumer)

    if scenario.status != 'skipped' and 'provider' in scenario.tags:
        setup_providers(context)

    if scenario.status != 'skipped' and 'vocabulary' in scenario.tags:
        with context.app.app_context():
            cmd = VocabulariesPopulateCommand()
            filename = os.path.join(os.path.abspath(os.path.dirname("features/steps/fixtures/")), "vocabularies.json")
            cmd.run(filename)

    if scenario.status != 'skipped' and 'content_type' in scenario.tags:
        with context.app.app_context():
            cmd = VocabulariesPopulateCommand()
            filename = os.path.join(os.path.abspath(os.path.dirname("features/steps/fixtures/")), "content_types.json")
            cmd.run(filename)

    if scenario.status != 'skipped' and 'notification' in scenario.tags:
        tests.setup_notification(context)
