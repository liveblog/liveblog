Feature: Membership request tenant isolation (F4)

    @auth
    Scenario: Contributor can request access to a blog in their own tenant
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"

        Given tenant aware "roles"
        """
        [{"name": "Contributor", "privileges": {"blogs": 1, "posts": 1, "archive": 1, "request_membership": 1}}]
        """
        Given tenant aware "users"
        """
        [{"username": "contributor1", "email": "c1@test.com", "is_active": true, "role": "#roles._id#", "password": "test123"}]
        """
        When we post to "blogs"
        """
        [{"title": "Team Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"

        When we login as user "contributor1" with password "test123"
        When we post to "/request_membership"
        """
        {"blog": "#blog_id#"}
        """
        Then we get new resource

    @auth
    Scenario: Cannot create membership request for another tenant's blog
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"

        # Tenant 2 admin cannot create a membership request for Tenant 1's blog
        # Eve's data_relation validation rejects the reference because BlogService
        # is tenant-aware and the blog doesn't exist in Tenant 2's scope
        When we login as tenant user "tenant2_admin"
        When we post to "/request_membership"
        """
        {"blog": "#tenant1_blog_id#"}
        """
        Then we get error 400

    @auth
    Scenario: Cannot list membership requests for another tenant's blog
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and a membership request
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "/request_membership"
        """
        {"blog": "#tenant1_blog_id#"}
        """
        Then we get new resource

        # Blog owner can see the request
        When we get "/blogs/#tenant1_blog_id#/request_membership"
        Then we get list with 1 items

        # User from another tenant cannot
        When we login as tenant user "tenant2_admin"
        When we get "/blogs/#tenant1_blog_id#/request_membership"
        Then we get error 404

    @auth
    Scenario: Bare listing of membership requests is disabled
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "Test Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we post to "/request_membership"
        """
        {"blog": "#blogs._id#"}
        """
        Then we get new resource
        When we get "/request_membership"
        Then we get error 405
