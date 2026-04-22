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

    @auth
    Scenario: Query param where cannot bypass tenant isolation on posts
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and a post
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "secret post", "blog": "#tenant1_blog_id#"}]
        """
        When we save "tenant1_post_id" from last response "_id"

        # Tenant 1 sees its own post in the list
        When we get "/blogs/#tenant1_blog_id#/posts"
        Then we get list with 1 items

        # Tenant 2 creates a blog so it has a valid session
        When we login as tenant user "tenant2_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant2 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant2_blog_id" from last response "_id"

        # Tenant 2 tries to inject a different tenant_id via where param
        When we get "/posts?where={"tenant_id": "000000000000000000000099"}"
        Then we get list with 0 items

        # Tenant 2 cannot access tenant1's post by ID
        When we get "/posts/#tenant1_post_id#"
        Then we get error 404

        # Tenant 2's own blog posts endpoint returns nothing for tenant1's blog
        When we get "/blogs/#tenant1_blog_id#/posts"
        Then we get error 404

    @auth
    Scenario: Elasticsearch source param cannot bypass tenant isolation on posts
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and a post
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 ES Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "secret ES post", "blog": "#tenant1_blog_id#"}]
        """

        # Tenant 2 tries to use source param with match_all to get all posts
        When we login as tenant user "tenant2_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant2 ES Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we get "/posts?source={"query": {"filtered": {"query": {"match_all": {}}}}}"
        Then we get list with 0 items

    @auth
    Scenario: Query param where cannot bypass tenant isolation on public blog posts
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and posts
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Public Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "public post one", "blog": "#tenant1_blog_id#"}, {"headline": "public post two", "blog": "#tenant1_blog_id#"}]
        """

        # Tenant 2 accesses tenant1's blog via public endpoint (this is expected to work
        # since client_blogs/<id>/posts is the public embed endpoint, scoped by blog_id)
        When we login as tenant user "tenant2_admin"
        When we get "/client_blogs/#tenant1_blog_id#/posts"
        Then we get list with 2 items

        # But tenant 2 cannot use where param to inject a different blog_id
        When we get "/client_blogs/#tenant1_blog_id#/posts?where={"blog": "000000000000000000000000"}"
        Then we get list with 0 items

    @auth
    Scenario: Legitimate where queries work within tenant scope
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
        [
            {"headline": "open post", "blog": "#blog_id#", "post_status": "open"},
            {"headline": "draft post", "blog": "#blog_id#", "post_status": "draft"}
        ]
        """

        # where filter narrows results within the tenant
        When we get "/posts?where={"post_status": "draft"}"
        Then we get list with 1 items
        """
        {"_items": [{"headline": "draft post"}]}
        """

        When we get "/posts?where={"post_status": "open"}"
        Then we get list with 1 items
        """
        {"_items": [{"headline": "open post"}]}
        """

    @auth
    Scenario: Legitimate source queries work within tenant scope
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
        [
            {"headline": "first post", "blog": "#blog_id#", "sticky": true},
            {"headline": "second post", "blog": "#blog_id#", "sticky": false}
        ]
        """

        # source filter with Elasticsearch query works within the tenant
        When we get "/posts?source={"query": {"filtered": {"filter": {"term": {"sticky": true}}}}}"
        Then we get list with 1 items
        """
        {"_items": [{"headline": "first post"}]}
        """

        When we get "/posts?source={"query": {"filtered": {"filter": {"term": {"sticky": false}}}}}"
        Then we get list with 1 items
        """
        {"_items": [{"headline": "second post"}]}
        """
