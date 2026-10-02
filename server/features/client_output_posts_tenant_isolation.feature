Feature: Public output channel posts with tenant isolation

    @auth
    Scenario: Anonymous embed reads output channel posts filtered by the output tags
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "posts"
        """
        [
            {"headline": "sport post", "blog": "#tenant1_blog_id#", "post_status": "open", "tags": ["sport"]},
            {"headline": "politics post", "blog": "#tenant1_blog_id#", "post_status": "open", "tags": ["politics"]}
        ]
        """
        When we post to "outputs"
        """
        {"name": "Sport channel", "blog": "#tenant1_blog_id#", "tags": ["sport"]}
        """
        When we save "tenant1_output_id" from last response "_id"

        # Plain public blog posts endpoint works anonymously (harness sanity check)
        When we get "/client_blogs/#tenant1_blog_id#/posts" without authentication
        Then we get list with 2 items

        # The output channel endpoint works anonymously and applies the output tags
        When we get "/client_blogs/#tenant1_blog_id#/#tenant1_output_id#/posts" without authentication
        Then we get list with 1 items
        """
        {"_items": [{"headline": "sport post"}]}
        """

    @auth
    Scenario: Anonymous embed cannot use another tenant's output channel
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "tenant1 post", "blog": "#tenant1_blog_id#", "post_status": "open", "tags": ["sport"]}]
        """

        When we login as tenant user "tenant2_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant2 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant2_blog_id" from last response "_id"
        When we post to "outputs"
        """
        {"name": "Tenant2 channel", "blog": "#tenant2_blog_id#", "tags": ["sport"]}
        """
        When we save "tenant2_output_id" from last response "_id"

        # Tenant two's output id against tenant one's blog is not found
        When we get "/client_blogs/#tenant1_blog_id#/#tenant2_output_id#/posts" without authentication
        Then we get error 404

        # Same when the request carries a tenant two session
        When we get "/client_blogs/#tenant1_blog_id#/#tenant2_output_id#/posts"
        Then we get error 404

    @auth
    Scenario: Output channel posts for a missing blog or output return 404
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "tenant1_blog_id" from last response "_id"
        When we post to "outputs"
        """
        {"name": "Channel", "blog": "#tenant1_blog_id#", "tags": []}
        """
        When we save "tenant1_output_id" from last response "_id"

        When we get "/client_blogs/#tenant1_blog_id#/000000000000000000000000/posts" without authentication
        Then we get error 404

        When we get "/client_blogs/000000000000000000000000/#tenant1_output_id#/posts" without authentication
        Then we get error 404
