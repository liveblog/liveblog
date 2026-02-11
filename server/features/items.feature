Feature: Items operations

	@auth
    Scenario: List empty items
        Given empty "items"
        When we get "/items"
        Then we get list with 0 items


    @auth
    Scenario: Add item
    	Given "themes"
        """
        [{"name": "forest"}]
        """
    	Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test item for an open blog", "blog": "#blogs._id#"}]
        """
        Then we get existing resource
        """
        {"text": "test item for an open blog", "blog": "#blogs._id#"}
        """
        When we get "items?embedded={"original_creator":1}"
        Then we get list with 1 items
	    """
	    {"_items": [{"text": "test item for an open blog", "blog": "#blogs._id#"}]}
	    """


	@auth
    Scenario: Update item
    	Given "themes"
        """
        [{"name": "forest"}]
        """
    	Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
       	When we post to "items"
        """
        [{"text": "test item for an open blog", "blog": "#blogs._id#"}]
        """
        When we patch latest
        """
        {"text": "this is a test item"}
        """
        And we patch latest
        """
        {"text":"the test of the test"}
        """
        Then we get updated response

	@auth
    Scenario: Delete item
    	Given "themes"
        """
        [{"name": "forest"}]
        """
    	Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        Given empty "items"
        When we post to "items"
        """
        [{"text": "test item", "blog": "#blogs._id#"}]
        """
        When we delete latest
        Then we get deleted response

    @auth
    Scenario: Items from different tenants are isolated
        Given "themes"
        """
        [{"name": "forest"}]
        """
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog and item
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "forest", "language": "en"}}]
        """
        Then we get OK response
        When we save "tenant1_blog_id" from last response "_id"

        When we post to "items"
        """
        [{"text": "Tenant1 Item", "blog": "#tenant1_blog_id#"}]
        """
        Then we get OK response
        When we save "tenant1_item_id" from last response "_id"
        When we save "IF_MATCH_VALUE" from last response "_etag"

        # Tenant 2 cannot see Tenant 1's items in list
        When we login as tenant user "tenant2_admin"
        When we get "/items"
        Then we get list with 0 items

        # Tenant 2 cannot access Tenant 1's item by ID
        When we get "/items/#tenant1_item_id#"
        Then we get error 404

        # Tenant 2 cannot update Tenant 1's item
        When we attempt to patch "/items/#tenant1_item_id#"
        """
        {"text": "Hacked"}
        """
        Then we get error 404

        # Tenant 2 cannot delete Tenant 1's item
        When we attempt to delete "/items/#tenant1_item_id#"
        Then we get error 404
