Feature: Post flags tenant isolation (F5)

    @auth
    Scenario: User can create and delete an edit flag on their own post
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "Test Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "blog_id" from last response "_id"
        When we post to "posts"
        """
        [{"headline": "test post", "blog": "#blog_id#"}]
        """
        When we save "post_id" from last response "_id"

        When we post to "post_flags"
        """
        [{"postId": "#post_id#", "flag_type": "edit"}]
        """
        Then we get OK response
        When we save "flag_id" from last response "_id"
        When we save "IF_MATCH_VALUE" from last response "_etag"

        When we delete "/post_flags/#flag_id#"
        Then we get deleted response

    @auth
    Scenario: Cannot create edit flag on another tenant's post
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
        [{"headline": "tenant1 post", "blog": "#tenant1_blog_id#"}]
        """
        When we save "tenant1_post_id" from last response "_id"

        # Tenant 2 cannot create a flag on Tenant 1's post
        # Eve's data_relation validation rejects the reference because PostsService
        # is tenant-aware and the post doesn't exist in Tenant 2's scope
        When we login as tenant user "tenant2_admin"
        When we post to "post_flags"
        """
        [{"postId": "#tenant1_post_id#", "flag_type": "edit"}]
        """
        Then we get error 400

    @auth
    Scenario: Listing post flags is not available
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we get "/post_flags"
        Then we get error 405
