Feature: User tenant isolation

    @auth
    Scenario: Users are created with tenant_id from logged-in user
        Given a tenant "Test Tenant"
        And a user "admin_user" for current tenant
        When we login as tenant user "admin_user"
        When we post to "liveblog_users"
        """
        {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "test123",
            "is_active": true,
            "user_type": "administrator"
        }
        """
        Then we get OK response
        When we get "/liveblog_users/#liveblog_users._id#"
        Then we get existing resource
        """
        {
            "username": "newuser",
            "tenant_id": "#tenants._id#"
        }
        """

    @auth
    Scenario: Users in different tenants cannot see each other
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "liveblog_users"
        """
        {
            "username": "tenant1_user",
            "email": "user1@tenant1.com",
            "password": "test123",
            "is_active": true,
            "user_type": "user"
        }
        """
        Then we get OK response
        When we save "user1_id" from last response "_id"

        When we login as tenant user "tenant2_admin"
        When we post to "liveblog_users"
        """
        {
            "username": "tenant2_user",
            "email": "user2@tenant2.com",
            "password": "test123",
            "is_active": true,
            "user_type": "user"
        }
        """
        Then we get OK response

        When we get "/liveblog_users"
        Then we get list with 2 items
        """
        {"_items": [{"username": "tenant2_admin"}, {"username": "tenant2_user"}]}
        """

        When we login as tenant user "tenant1_admin"
        When we get "/liveblog_users"
        Then we get list with 2 items
        """
        {"_items": [{"username": "tenant1_admin"}, {"username": "tenant1_user"}]}
        """

    @auth
    Scenario: User cannot access user from different tenant by ID
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "liveblog_users"
        """
        {
            "username": "tenant1_user",
            "email": "user1@tenant1.com",
            "password": "test123",
            "is_active": true,
            "user_type": "user"
        }
        """
        Then we get OK response
        When we save "user1_id" from last response "_id"

        When we login as tenant user "tenant2_admin"
        When we get "/liveblog_users/#user1_id#"
        Then we get error 404

    @auth
    Scenario: User cannot update user from different tenant
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "liveblog_users"
        """
        {
            "username": "tenant1_user",
            "email": "user1@tenant1.com",
            "password": "test123",
            "is_active": true,
            "user_type": "user"
        }
        """
        Then we get OK response
        When we save "user1_id" from last response "_id"
        When we save "IF_MATCH_VALUE" from last response "_etag"

        When we login as tenant user "tenant2_admin"
        When we attempt to patch "/liveblog_users/#user1_id#"
        """
        {"first_name": "Hacked"}
        """
        Then we get error 404

    @auth
    Scenario: User cannot delete user from different tenant
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "liveblog_users"
        """
        {
            "username": "tenant1_user",
            "email": "user1@tenant1.com",
            "password": "test123",
            "is_active": true,
            "user_type": "user"
        }
        """
        Then we get OK response
        When we save "user1_id" from last response "_id"

        When we login as tenant user "tenant2_admin"
        When we attempt to delete "/liveblog_users/#user1_id#"
        Then we get error 404
