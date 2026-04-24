Feature: Analytics tenant isolation (F11)

    @auth
    Scenario: Analytics hit endpoint records hits with tenant context
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "Test Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"

        # Record a hit via the public blueprint
        When we post to "/api/analytics/hit"
        """
        {"blog_id": "#blog_id#", "context_url": "http://example.com/embed"}
        """
        Then we get OK response

        # Blog owner can see the analytics via blog-scoped endpoint
        When we get "/blogs/#blog_id#/bloganalytics"
        Then we get list with 1 items

    @auth
    Scenario: Analytics listing is tenant-scoped
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and records a hit
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "/api/analytics/hit"
        """
        {"blog_id": "#tenant1_blog_id#", "context_url": "http://tenant1.com/embed"}
        """
        Then we get OK response

        # Tenant 1 sees its analytics
        When we get "/analytics"
        Then we get list with 1 items

        # Tenant 2 cannot see Tenant 1's analytics
        When we login as tenant user "tenant2_admin"
        When we get "/analytics"
        Then we get list with 0 items

    @auth
    Scenario: Cannot view blog analytics for another tenant's blog
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and records a hit
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "/api/analytics/hit"
        """
        {"blog_id": "#tenant1_blog_id#", "context_url": "http://tenant1.com/embed"}
        """
        Then we get OK response

        # Tenant 2 cannot access Tenant 1's blog analytics
        When we login as tenant user "tenant2_admin"
        When we get "/blogs/#tenant1_blog_id#/bloganalytics"
        Then we get error 404

    Scenario: Analytics listing requires authentication
        When we get "/analytics"
        Then we get error 401

    @auth
    Scenario: Analytics hit rejects invalid blog ID
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "/api/analytics/hit"
        """
        {"blog_id": "000000000000000000000000", "context_url": "http://example.com"}
        """
        Then we get response code 409
