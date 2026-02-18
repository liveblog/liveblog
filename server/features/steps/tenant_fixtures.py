"""
Tenant-aware test fixtures for Behave tests.

This module provides reusable behave steps and helper functions for setting up
multi-tenant test scenarios. It ensures proper tenant isolation in all tests.

Usage:
    @auth @with_tenant
    Scenario: Test with automatic tenant setup
        Given a tenant "Acme Corp"
        And a user "john" for current tenant
        When we login as user "john" with password "test123"
        ...
"""

from behave import given, when
from bson.objectid import ObjectId
from superdesk.tests import set_placeholder


# Default test credentials
DEFAULT_PASSWORD = "test123"


def create_tenant_fixture(
    context, tenant_name, tenant_id=None, subscription_level="solo"
):
    """
    Create a tenant fixture with proper ObjectId.

    Args:
        context: Behave context
        tenant_name (str): Name of the tenant
        tenant_id (str, optional): Specific ObjectId to use, generates one if not provided
        subscription_level (str): Subscription level (solo, team, enterprise)

    Returns:
        dict: Created tenant data with _id as ObjectId
    """
    if tenant_id is None:
        tenant_id = str(ObjectId())

    tenant_data = {
        "_id": tenant_id,
        "name": tenant_name,
        "subscription_level": subscription_level,
    }

    # Store in context for later reference
    if not hasattr(context, "tenants"):
        context.tenants = {}
    context.tenants[tenant_name] = tenant_data

    return tenant_data


def create_user_fixture(
    context, username, tenant_id, user_id=None, user_type="administrator", **kwargs
):
    """
    Create a user fixture linked to a tenant.

    Args:
        context: Behave context
        username (str): Username
        tenant_id (str): Tenant ObjectId (as string)
        user_id (str, optional): Specific ObjectId to use
        user_type (str): User type (administrator, editor, etc.)
        **kwargs: Additional user fields (email, first_name, etc.)

    Returns:
        dict: Created user data with _id and tenant_id as ObjectId
    """
    if user_id is None:
        user_id = str(ObjectId())

    user_data = {
        "_id": user_id,
        "username": username,
        "email": kwargs.get("email", f"{username}@example.com"),
        "password": kwargs.get("password", DEFAULT_PASSWORD),
        "is_active": True,
        "user_type": user_type,
        "tenant_id": tenant_id,
    }

    # Add optional fields
    if "first_name" in kwargs:
        user_data["first_name"] = kwargs["first_name"]
    if "last_name" in kwargs:
        user_data["last_name"] = kwargs["last_name"]

    # Store in context for later reference
    # Use 'test_users' to avoid conflicts with context.users (set by Superdesk)
    if not hasattr(context, "test_users"):
        context.test_users = {}
    context.test_users[username] = user_data

    return user_data


@given('a tenant "{tenant_name}"')
def step_create_tenant(context, tenant_name):
    """
    Create a tenant and set it as the current tenant.

    Example:
        Given a tenant "Acme Corp"
    """
    tenant_data = create_tenant_fixture(context, tenant_name)

    # Store as current tenant
    context.current_tenant = tenant_data

    # Create the tenant in the database using the "with objectid" step
    context.execute_steps(
        f'''
        Given "tenants" with objectid
        """
        [{{"_id": "{tenant_data['_id']}", "name": "{tenant_data['name']}", "subscription_level": "{tenant_data['subscription_level']}"}}]
        """
    '''
    )


@given('a user "{username}" for current tenant')
def step_create_user_for_current_tenant(context, username):
    """
    Create a user for the current tenant.

    Must be called after 'Given a tenant'.

    Example:
        Given a tenant "Acme Corp"
        And a user "john" for current tenant
    """
    assert hasattr(
        context, "current_tenant"
    ), "No current tenant set. Use 'Given a tenant' first."

    tenant_id = context.current_tenant["_id"]
    user_data = create_user_fixture(context, username, tenant_id)

    # Use users service to create user (handles password hashing in on_create hook)
    from bson import ObjectId
    from superdesk import get_resource_service

    user_doc = {
        # Don't pass _id - let service generate it
        "username": user_data["username"],
        "email": user_data["email"],
        "password": user_data[
            "password"
        ],  # Plaintext - will be hashed by DBUsersService.on_create
        "is_active": True,
        "needs_activation": False,  # Skip activation email for tests
        "user_type": user_data["user_type"],
        "tenant_id": ObjectId(user_data["tenant_id"]),
        "first_name": user_data.get("first_name", username),
        "last_name": user_data.get("last_name", "Test"),
    }

    with context.app.app_context():
        users_service = get_resource_service("users")
        created_ids = users_service.post([user_doc])
        # Update the stored user_data with the actual generated _id
        user_data["_id"] = str(created_ids[0])


@given('a user "{username}" for tenant "{tenant_name}"')
def step_create_user_for_tenant(context, username, tenant_name):
    """
    Create a user for a specific tenant by name.

    Example:
        Given a tenant "Acme Corp"
        And a user "john" for tenant "Acme Corp"
    """
    assert hasattr(context, "tenants"), "No tenants created yet"
    assert tenant_name in context.tenants, f"Tenant '{tenant_name}' not found"

    tenant_id = context.tenants[tenant_name]["_id"]
    user_data = create_user_fixture(context, username, tenant_id)

    # Use users service to create user (handles password hashing in on_create hook)
    from bson import ObjectId
    from superdesk import get_resource_service

    user_doc = {
        # Don't pass _id - let service generate it
        "username": user_data["username"],
        "email": user_data["email"],
        "password": user_data[
            "password"
        ],  # Plaintext - will be hashed by DBUsersService.on_create
        "is_active": True,
        "needs_activation": False,  # Skip activation email for tests
        "user_type": user_data["user_type"],
        "tenant_id": ObjectId(user_data["tenant_id"]),
        "first_name": user_data.get("first_name", username),
        "last_name": user_data.get("last_name", "Test"),
    }

    with context.app.app_context():
        users_service = get_resource_service("users")
        created_ids = users_service.post([user_doc])
        # Update the stored user_data with the actual generated _id
        user_data["_id"] = str(created_ids[0])


@given("multiple tenants")
def step_create_multiple_tenants(context):
    """
    Create multiple tenants from a table.

    Example:
        Given multiple tenants
            | name          | subscription_level |
            | Acme Corp     | enterprise         |
            | Small Startup | solo              |
    """
    assert context.table, "Table data required for multiple tenants"

    tenant_list = []
    for row in context.table:
        tenant_name = row["name"]
        subscription_level = row.get("subscription_level", "solo")

        tenant_data = create_tenant_fixture(
            context, tenant_name, subscription_level=subscription_level
        )
        tenant_list.append(tenant_data)

    # Create all tenants in database
    import json

    tenants_json = json.dumps(
        [
            {
                "_id": t["_id"],
                "name": t["name"],
                "subscription_level": t["subscription_level"],
            }
            for t in tenant_list
        ]
    )

    context.execute_steps(
        f'''
        Given "tenants" with objectid
        """
        {tenants_json}
        """
    '''
    )


@when('we login as tenant user "{username}"')
def step_login_as_tenant_user(context, username):
    """
    Login as a previously created tenant user.

    Uses the stored user credentials from context.

    Example:
        Given a tenant "Acme Corp"
        And a user "john" for current tenant
        When we login as tenant user "john"
    """
    assert hasattr(context, "test_users"), "No users created yet"
    assert username in context.test_users, f"User '{username}' not found"

    password = context.test_users[username].get("password", DEFAULT_PASSWORD)

    context.execute_steps(
        f"""
        When we login as user "{username}" with password "{password}"
    """
    )


@given('a user "{username}" in same tenant as test_user')
def step_create_user_same_tenant(context, username):
    """
    Create a user in the same tenant as the test_user.

    This is useful for scenarios that need additional users in the same tenant
    without explicitly creating a tenant.

    Example:
        @auth
        Scenario: Multiple users in same tenant
            Given a user "editor" in same tenant as test_user
            When we login as tenant user "editor"
    """
    # Get test_user's tenant_id from flask.g (set by @auth fixture)
    from flask import g
    from liveblog.tenancy import get_tenant_id
    from bson import ObjectId
    from superdesk import get_resource_service

    tenant_id = get_tenant_id(required=False)

    # If no tenant_id in context, create one (for test_user)
    if not tenant_id:
        tenant_id = str(ObjectId())
        # Store for later reference
        if not hasattr(context, "default_tenant_id"):
            context.default_tenant_id = tenant_id

    user_data = create_user_fixture(context, username, str(tenant_id))

    # Use users service to create user (handles password hashing in on_create hook)
    user_doc = {
        # Don't pass _id - let service generate it
        "username": user_data["username"],
        "email": user_data["email"],
        "password": user_data[
            "password"
        ],  # Plaintext - will be hashed by DBUsersService.on_create
        "is_active": True,
        "needs_activation": False,  # Skip activation email for tests
        "user_type": user_data["user_type"],
        "tenant_id": ObjectId(user_data["tenant_id"]),
        "first_name": user_data.get("first_name", username),
        "last_name": user_data.get("last_name", "Test"),
    }

    with context.app.app_context():
        users_service = get_resource_service("users")
        created_ids = users_service.post([user_doc])
        # Update the stored user_data with the actual generated _id
        user_data["_id"] = str(created_ids[0])


@given('a user "{username}" in same tenant with role "{role_id}"')
def step_create_user_same_tenant_with_role(context, username, role_id):
    """
    Create a user in the same tenant as test_user with a specific role.

    NOTE: This step is currently not working because UsersService doesn't
    inherit from TenantAwareService, so users don't automatically get tenant_id.
    This needs to be fixed before this step can be used.

    Example:
        @auth
        Scenario: User with specific role
            Given "roles"
            \"\"\"
            [{"name": "Editor", "privileges": {"blogs": 1}}]
            \"\"\"
            Given a user "editor" in same tenant with role "#roles._id#"
    """
    raise NotImplementedError(
        "This step requires UsersService to inherit from TenantAwareService. "
        "Users are currently created without tenant_id in the database."
    )


@given("system themes")
def step_load_system_themes(context):
    """
    Load system themes (angular, classic, default, amp, simple) as fixtures.

    System themes have tenant_id = null and are globally visible to all tenants.

    Example:
        Given system themes
        When we get "/themes"
        Then we get list with 5 items
    """
    from liveblog.system_themes import system_themes
    from liveblog.tenancy.context import set_system_mode, reset_system_mode
    from superdesk import get_resource_service

    # Create minimal theme fixtures for each system theme
    themes_list = [
        {"name": theme_name, "tenant_id": None, "version": "1.0.0"}
        for theme_name in system_themes
    ]

    # Enter system mode to bypass tenant requirements when creating system themes
    token = set_system_mode()
    try:
        with context.app.app_context():
            themes_service = get_resource_service("themes")
            themes_service.post(themes_list)
    finally:
        reset_system_mode(token)


@given('the theme quota is {limit:d}')
def step_set_theme_quota(context, limit):
    """
    Set the theme quota limit for the current subscription plan.

    Example:
        Given the theme quota is 10
    """
    from unittest.mock import MagicMock

    # Set the theme limit in the mocked settings
    plan = "test_plan"
    context.app.features._settings = {plan: {"limits": {"custom_themes": limit}}}
    context.app.features.current_sub_level = MagicMock(return_value=plan)


__all__ = [
    "create_tenant_fixture",
    "create_user_fixture",
    "DEFAULT_PASSWORD",
]
