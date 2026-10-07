Feature: Multi-tenancy and tenant isolation

    Scenario: Register new user creates tenant automatically
        When we post to "/api/register"
        """
        {
            "username": "tenant1user",
            "email": "tenant1@example.com",
            "password": "securepass123",
            "first_name": "Tenant",
            "last_name": "One"
        }
        """
        Then we get response code 201
        And response has key "user_id"
        And response has key "tenant_id"
        And response has key "tenant_name"
        And response has key "message"

    Scenario: Registration fails with duplicate username
        When we post to "/api/register"
        """
        {
            "username": "duplicateuser",
            "email": "user1@example.com",
            "password": "securepass123",
            "first_name": "User",
            "last_name": "One"
        }
        """
        Then we get response code 201
        When we post to "/api/register"
        """
        {
            "username": "duplicateuser",
            "email": "user2@example.com",
            "password": "securepass123",
            "first_name": "User",
            "last_name": "Two"
        }
        """
        Then we get error 400

    Scenario: Registration fails with duplicate email
        When we post to "/api/register"
        """
        {
            "username": "user1",
            "email": "duplicate@example.com",
            "password": "securepass123",
            "first_name": "User",
            "last_name": "One"
        }
        """
        Then we get response code 201
        When we post to "/api/register"
        """
        {
            "username": "user2",
            "email": "duplicate@example.com",
            "password": "securepass123",
            "first_name": "User",
            "last_name": "Two"
        }
        """
        Then we get error 400

    Scenario: Registration validates required fields
        When we post to "/api/register"
        """
        {
            "email": "test@example.com",
            "password": "securepass123"
        }
        """
        Then we get error 400
        When we post to "/api/register"
        """
        {
            "username": "testuser",
            "password": "securepass123"
        }
        """
        Then we get error 400
        When we post to "/api/register"
        """
        {
            "username": "testuser",
            "email": "test@example.com"
        }
        """
        Then we get error 400

    @auth
    Scenario: Users in different tenants cannot see each other's blogs
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_user" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_user" for current tenant
        When we login as tenant user "tenant1_user"
        When we post to "blogs"
        """
        [{
            "title": "Tenant 1 Blog",
            "description": "This blog belongs to tenant 1",
            "blog_status": "open",
            "blog_preferences": {"theme": "classic", "language": "en"}
        }]
        """
        Then we get OK response
        When we login as tenant user "tenant2_user"
        When we post to "blogs"
        """
        [{
            "title": "Tenant 2 Blog",
            "description": "This blog belongs to tenant 2",
            "blog_status": "open",
            "blog_preferences": {"theme": "classic", "language": "en"}
        }]
        """
        Then we get OK response
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "Tenant 2 Blog"}]}
        """
        When we login as tenant user "tenant1_user"
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "Tenant 1 Blog"}]}
        """

    @auth
    Scenario: User cannot access blog from different tenant
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_user" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_user" for current tenant
        When we login as tenant user "tenant1_user"
        When we post to "blogs"
        """
        [{
            "title": "Tenant 1 Blog",
            "blog_status": "open",
            "blog_preferences": {"theme": "classic", "language": "en"}
        }]
        """
        Then we get OK response
        When we save "blog_id" from last response "_id"
        When we login as tenant user "tenant2_user"
        When we get "/blogs/#blog_id#"
        Then we get error 404
