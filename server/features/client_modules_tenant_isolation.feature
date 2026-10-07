Feature: Client modules tenant isolation

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
    Scenario: Client posts endpoint does not expose draft posts
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "test_blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"

        # Create a draft, a contribution, and an open post
        When we post to "posts"
        """
        [{"headline": "draft post", "blog": "#blog_id#", "post_status": "draft"}]
        """
        When we save "draft_post_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "contribution post", "blog": "#blog_id#", "post_status": "submitted"}]
        """
        When we save "submitted_post_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "open post", "blog": "#blog_id#", "post_status": "open"}]
        """
        When we save "open_post_id" from last response "_id"

        # Client endpoint returns the open post
        When we get "/client_posts/#open_post_id#"
        Then we get existing resource
        """
        {"headline": "open post"}
        """

        # Client endpoint does not return the draft post
        When we get "/client_posts/#draft_post_id#"
        Then we get error 404

        # Client endpoint does not return the contribution (submitted) post
        When we get "/client_posts/#submitted_post_id#"
        Then we get error 404

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
    Scenario: Client items with valid blog reference are accessible
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "Test Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"
        When we post to "items"
        """
        [{"text": "Test Item", "blog": "#blog_id#", "item_type": "text"}]
        """
        When we save "item_id" from last response "_id"
        When we get "/client_items/#item_id#"
        Then we get existing resource
        """
        {"text": "Test Item"}
        """

    @auth
    Scenario: Client items with invalid blog reference return 404
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "Test Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"
        When we post to "items"
        """
        [{"text": "Orphan Item", "blog": "#blog_id#", "item_type": "text"}]
        """
        When we save "item_id" from last response "_id"
        # Delete the blog so the item's blog reference becomes invalid
        When we delete "/blogs/#blog_id#"
        Then we get deleted response
        When we get "/client_items/#item_id#"
        Then we get error 404

    @auth
    Scenario: Poll vote applies within the correct tenant context
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "Test Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"
        When we post to "polls"
        """
        [{"blog": "#blog_id#", "text": "Test Poll", "poll_body": {"question": "Vote?", "answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}]
        """
        When we save "poll_id" from last response "_id"

        # Vote succeeds and increments the count
        When we post to "/api/client_poll_vote/#poll_id#"
        """
        {"option_selected": "Yes"}
        """
        Then we get OK response

        # Verify the vote was counted
        When we get "/polls/#poll_id#"
        Then we get existing resource
        """
        {"poll_body": {"answers": [{"option": "Yes", "votes": 1}, {"option": "No", "votes": 0}]}}
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
