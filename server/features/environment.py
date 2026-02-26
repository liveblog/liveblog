# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license

from app import get_app
from liveblog.tests.environment import setup_before_scenario
from superdesk.tests.environment import setup_before_all
from settings import INSTALLED_APPS, BEHAVE_TESTS_FIXTURES_PATH


def before_all(context):
    config = {
        "INSTALLED_APPS": INSTALLED_APPS,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "BEHAVE_TESTS_FIXTURES_PATH": BEHAVE_TESTS_FIXTURES_PATH,
        "NO_TAKES": True,
        "CELERY_ALWAYS_EAGER": True,
        "MAIL_SUPPRESS_SEND": True,
    }
    setup_before_all(context, config, app_factory=get_app)


def before_scenario(context, scenario):
    config = {
        "INSTALLED_APPS": INSTALLED_APPS,
        "ELASTICSEARCH_FORCE_REFRESH": True,
        "BEHAVE_TESTS_FIXTURES_PATH": BEHAVE_TESTS_FIXTURES_PATH,
        "NO_TAKES": True,
        "CELERY_ALWAYS_EAGER": True,
        "MAIL_SUPPRESS_SEND": True,
    }
    setup_before_scenario(context, scenario, config, app_factory=get_app)

    # Ensure FeaturesService is always initialized for tests
    if not hasattr(context.app, "features"):
        from unittest.mock import MagicMock
        from liveblog.instance_settings.features_service import FeaturesService

        def db_service_mock():
            db_service = MagicMock()
            db_service.get_existing_config = MagicMock()
            return db_service

        context.app.features = FeaturesService(context.app, db_service_mock())
