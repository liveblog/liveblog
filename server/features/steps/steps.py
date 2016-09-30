# -*- coding: utf-8; -*-
#
# This file is part of Superdesk.
#
# Copyright 2013, 2014 Sourcefabric z.u. and contributors.
#
# For the full copyright and license information, please see the
# AUTHORS and LICENSE files distributed with this source code, or
# at https://www.sourcefabric.org/superdesk/license


import superdesk.tests as tests
from behave import given, when  # @UnresolvedImport
from flask import json
from superdesk.tests import set_placeholder
from superdesk import get_resource_service

external_url = 'http://thumbs.dreamstime.com/z/digital-nature-10485007.jpg'


@when('we switch to user of type user')
def when_we_switch_user_of_type_user(context):
    user = {'username': 'test-user-2', 'password': 'pwd', 'is_active': True, 'needs_activation': False,
            'user_type': 'user'}
    tests.setup_auth_user(context, user)
    set_placeholder(context, 'USERS_ID', str(context.user['_id']))


def login_as(context, username, password):
    user = {'username': username, 'password': password, 'is_active': True,
            'is_enabled': True, 'needs_activation': False}

    if context.text:
        user.update(json.loads(context.text))

    tests.setup_auth_user(context, user)


@given('we login as user "{username}" with password "{password}"')
def given_we_login_as_user(context, username, password):
    login_as(context, username, password)


@when('we login as user "{username}" with password "{password}"')
def when_we_login_as_user(context, username, password):
    login_as(context, username, password)


@when('we register "{theme_name}"')
def step_impl_register_themes(context, theme_name):
    with context.app.test_request_context(context.app.config['URL_PREFIX']):
        theme = get_resource_service('themes').find_one(req=None, name=theme_name)
        return get_resource_service('themes').save_or_update_theme(theme)
