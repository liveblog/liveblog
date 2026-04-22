Feature: Client modules tenant isolation (F1/F2 regression tests)

    @auth
    Scenario: Client posts listing is disabled
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "test_blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we post to "posts"
        """
        [{"headline": "test_post", "blog": "#blogs._id#"}]
        """
        When we get "/client_posts"
        Then we get error 405
        When we get "/client_posts/#posts._id#"
        Then we get existing resource
        """
        {"headline": "test_post"}
        """

    @auth
    Scenario: Blog-scoped post listing still works
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "test_blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "post one", "blog": "#blog_id#"}, {"headline": "post two", "blog": "#blog_id#"}]
        """
        When we get "/client_blogs/#blog_id#/posts"
        Then we get list with 2 items

    @auth
    Scenario: Client items get-by-id is tenant-scoped for authenticated users
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and an item
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "items"
        """
        [{"text": "Tenant1 Item", "blog": "#tenant1_blog_id#", "item_type": "text"}]
        """
        When we save "tenant1_item_id" from last response "_id"

        # Tenant 2 cannot see Tenant 1's item
        When we login as tenant user "tenant2_admin"
        When we get "/client_items/#tenant1_item_id#"
        Then we get error 404

    @auth
    Scenario: Client polls get-by-id is tenant-scoped for authenticated users
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and a poll
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "polls"
        """
        [{"blog": "#tenant1_blog_id#", "text": "Tenant1 Poll", "poll_body": {"question": "Test?", "answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}]
        """
        When we save "tenant1_poll_id" from last response "_id"

        # Tenant 2 cannot see Tenant 1's poll
        When we login as tenant user "tenant2_admin"
        When we get "/client_polls/#tenant1_poll_id#"
        Then we get error 404

    @auth
    Scenario: Cannot vote on poll from another tenant
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and a poll
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "polls"
        """
        [{"blog": "#tenant1_blog_id#", "text": "Tenant1 Poll", "poll_body": {"question": "Vote?", "answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}]
        """
        When we save "tenant1_poll_id" from last response "_id"

        # Tenant 2 attempts to vote on Tenant 1's poll
        When we login as tenant user "tenant2_admin"
        When we post to "/api/client_poll_vote/#tenant1_poll_id#"
        """
        {"option_selected": "Yes"}
        """
        Then we get error 404

        # Verify Tenant 1's poll votes are unchanged
        When we login as tenant user "tenant1_admin"
        When we get "/polls/#tenant1_poll_id#"
        Then we get existing resource
        """
        {"poll_body": {"answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}
        """
