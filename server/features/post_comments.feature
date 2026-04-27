Feature: Post comments tenant isolation

    @auth
    Scenario: Post comments from different tenants are isolated
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog, a post, and a comment on that post
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        Then we get OK response
        When we save "tenant1_blog_id" from last response "_id"

        When we post to "posts"
        """
        [{"headline": "Tenant1 Post", "blog": "#tenant1_blog_id#", "post_status": "open"}]
        """
        Then we get OK response
        When we save "tenant1_post_id" from last response "_id"

        When we post to "post_comments"
        """
        [{"blog_id": "#tenant1_blog_id#", "post_id": "#tenant1_post_id#", "author_name": "Tenant1 Author", "text": "Tenant 1 comment"}]
        """
        Then we get OK response
        When we save "tenant1_comment_id" from last response "_id"
        When we save "IF_MATCH_VALUE" from last response "_etag"

        # Tenant 2 cannot see Tenant 1's comments in list
        When we login as tenant user "tenant2_admin"
        When we get "/post_comments"
        Then we get list with 0 items

        # Tenant 2 cannot access Tenant 1's comment by ID
        When we get "/post_comments/#tenant1_comment_id#"
        Then we get error 404

        # Tenant 2 cannot update Tenant 1's comment
        When we attempt to patch "/post_comments/#tenant1_comment_id#"
        """
        {"text": "Hacked"}
        """
        Then we get error 404

        # Tenant 2 cannot delete Tenant 1's comment
        When we attempt to delete "/post_comments/#tenant1_comment_id#"
        Then we get error 404
