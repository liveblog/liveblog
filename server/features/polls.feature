Feature: Polls tenant isolation

    @auth
    Scenario: Polls from different tenants are isolated
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
        Then we get OK response
        When we save "tenant1_blog_id" from last response "_id"

        When we post to "polls"
        """
        [{"blog": "#tenant1_blog_id#", "text": "Tenant1 Poll", "poll_body": {"question": "Best liveblog?", "answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}]
        """
        Then we get OK response
        When we save "tenant1_poll_id" from last response "_id"
        When we save "IF_MATCH_VALUE" from last response "_etag"

        # Tenant 2 cannot see Tenant 1's polls in list
        When we login as tenant user "tenant2_admin"
        When we get "/polls"
        Then we get list with 0 items

        # Tenant 2 cannot access Tenant 1's poll by ID
        When we get "/polls/#tenant1_poll_id#"
        Then we get error 404

        # Tenant 2 cannot update Tenant 1's poll
        When we attempt to patch "/polls/#tenant1_poll_id#"
        """
        {"text": "Hacked"}
        """
        Then we get error 404

        # Tenant 2 cannot delete Tenant 1's poll
        When we attempt to delete "/polls/#tenant1_poll_id#"
        Then we get error 404
