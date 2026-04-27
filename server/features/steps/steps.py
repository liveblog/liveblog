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
from superdesk.tests.steps import apply_placeholders, parse, is_user_resource
from superdesk import get_resource_service
from liveblog.tests import tenant_request_context

external_url = "http://thumbs.dreamstime.com/z/digital-nature-10485007.jpg"


@given('tenant aware "{resource}"')
def given_tenant_aware_resource(context, resource):
    """Create test fixtures scoped to the current tenant context.

    Parses JSON from the step's text body, resolves placeholders, and posts
    the resulting items via the named resource service. For non-user resources
    all existing documents are deleted before insertion. For user resources
    (``users`` or ``liveblog_users``) the tenant_id is inherited from the
    currently authenticated context user so that documents are correctly
    isolated within the tenant.

    Sets ``context.data``, ``context.resource``, and an attribute named after
    the resource pointing to the last inserted item.

    Args:
        context: Behave context. ``context.text`` must contain a JSON array.
        resource: Eve resource name (e.g. ``"blogs"``, ``"liveblog_users"``).
    """
    data = apply_placeholders(context, context.text)

    # Check if this is a user resource (users or liveblog_users)
    is_user_res = is_user_resource(resource) or resource == "liveblog_users"

    with tenant_request_context(context):
        if not is_user_res:
            get_resource_service(resource).delete_action()

        items = [parse(item, resource) for item in json.loads(data)]

        if is_user_res:
            for item in items:
                item.setdefault("needs_activation", False)
                # Ensure users inherit tenant from test user
                if (
                    hasattr(context, "user")
                    and context.user
                    and "tenant_id" in context.user
                ):
                    item["tenant_id"] = context.user["tenant_id"]

        get_resource_service(resource).post(items)
        context.data = items
        context.resource = resource
        try:
            setattr(context, resource, items[-1])
        except KeyError:
            pass


@given('tenant aware "{resource}" as item list')
def given_tenant_aware_resource_as_item_list(context, resource):
    """Like 'tenant aware' but stores each item as resource[0], resource[1], etc."""
    data = apply_placeholders(context, context.text)

    with tenant_request_context(context):
        if not is_user_resource(resource):
            get_resource_service(resource).delete_action()

        items = [parse(item, resource) for item in json.loads(data)]
        get_resource_service(resource).post(items)
        context.data = items
        context.resource = resource
        for i, item in enumerate(items):
            setattr(context, "{}[{}]".format(resource, i), item)


@given('empty tenant aware "{resource}"')
def given_empty_tenant_aware_resource(context, resource):
    """Delete all test fixtures with proper tenant context for tenant-aware services."""
    if not is_user_resource(resource):
        with tenant_request_context(context):
            get_resource_service(resource).delete_action()


@when("we switch to user of type user")
def when_we_switch_user_of_type_user(context):
    user = {
        "username": "test-user-2",
        "password": "pwd",
        "is_active": True,
        "needs_activation": False,
        "user_type": "user",
    }
    # Set tenant_id from context if available
    if hasattr(context, "user") and context.user and "tenant_id" in context.user:
        user["tenant_id"] = context.user["tenant_id"]

    tests.setup_auth_user(context, user)
    set_placeholder(context, "USERS_ID", str(context.user["_id"]))


def login_as(context, username, password):
    """Login as a user, preserving their tenant_id if they were created in the same tenant."""
    user = {
        "username": username,
        "password": password,
        "is_active": True,
        "is_enabled": True,
        "needs_activation": False,
    }

    if context.text:
        user.update(json.loads(context.text))

    # If logging in as a user created in this test, get their tenant_id from the database
    with context.app.test_request_context(context.app.config["URL_PREFIX"]):
        # Check system users service (no tenant filtering, username is globally unique)
        users_service = get_resource_service("users")
        existing_user = users_service.find_one(req=None, username=username)

        if existing_user and "tenant_id" in existing_user:
            user["tenant_id"] = existing_user["tenant_id"]
        elif hasattr(context, "user") and context.user and "tenant_id" in context.user:
            # If user doesn't exist but there's a tenant context, inherit it
            # This allows temporary test users to work within tenant-aware tests
            user["tenant_id"] = context.user["tenant_id"]

    tests.setup_auth_user(context, user)


@given('we login as user "{username}" with password "{password}"')
def given_we_login_as_user(context, username, password):
    login_as(context, username, password)


@when('we login as user "{username}" with password "{password}"')
def when_we_login_as_user(context, username, password):
    login_as(context, username, password)


@when('we register "{theme_name}"')
def step_impl_register_themes(context, theme_name):
    with context.app.test_request_context(context.app.config["URL_PREFIX"]):
        theme = get_resource_service("themes").find_one(req=None, name=theme_name)
        return get_resource_service("themes").save_or_update_theme(theme)
