Feature: Blog operations

    @auth
    Scenario: List empty blogs
        Given empty tenant aware "blogs"
        When we get "/blogs"
        Then we get list with 0 items

    @auth
    Scenario: Add blog
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given empty tenant aware "blogs"
        When we post to "blogs"
        """
        [{"title": "title One", "description": "description", "blog_status": "open", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        And we get "blogs?embedded={"original_creator":1}"
        Then we get list with 1 items
        """
        {"_items": [{"title": "title One", "description": "description", "blog_status": "open", "original_creator": {"username": "test_user"}}]}
        """

    @auth
    Scenario: Update blog
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """	
        When we post to "blogs"
        """
        [{"title": "testBlog", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        When we patch latest
        """
        {"description": "this is a test blog"}
        """
        And we patch latest
        """
        {"description":"the test of the test"}
        """
        Then we get updated response

    @auth
    Scenario: Update blog without being the owner
        Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given tenant aware "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given tenant aware "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty tenant aware "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Update blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we patch "/blogs/#blogs._id#"
        """
        {"description": "this is a test blog"}
        """
        Then we get OK response

    @auth
    Scenario: Check blog_status
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given tenant aware "blogs"
        """
        [{"title": "testBlog", "blog_status": "closed", "blog_preferences": {"theme": "forest", "language": "fr"}}, {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "testBlog2", "blog_status": "closed"}, {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "testBlog3", "blog_status": "open"}]
        """
        When we get "/blogs?source={"query": {"filtered": {"filter": {"term": {"blog_status": "closed"}}}}}"
        Then we get list with 2 items
        """
        {"_items": [{"title": "testBlog"}, {"title": "testBlog2"}]}
        """
        When we get "/blogs?source={"query": {"filtered": {"filter": {"term": {"blog_status": "open"}}}}}"
        Then we get list with 1 items
        """
        {"_items": [{"title": "testBlog3"}]}
        """

    @auth
    Scenario: Search for blogs
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given tenant aware "blogs"
        """
        [
         {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "title One", "description": "Description", "blog_status": "open"},
         {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "title Two", "description": "one", "blog_status": "open"},
         {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Title three", "blog_status": "open"},
         {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "title one, two, three", "description": "description", "blog_status": "closed"}
        ]
        """

        When we get "/blogs?source={"query": {"filtered": {"filter": {"term": {"blog_status": "open"}}, "query": {"query_string": {"query": "title:(descript*) description:(descript*)", "lenient": false, "default_operator": "OR"}} }}}"
        Then we get list with 1 items
        """
        {"_items": [{"title": "title One", "description": "Description", "blog_status": "open"}]}
        """

        When we get "/blogs?source={"query": {"filtered": {"filter": {"term": {"blog_status": "open"}}, "query": {"query_string": {"query": "title:(One) description:(One)", "lenient": false, "default_operator": "OR"}} }}}"
        Then we get list with 2 items
        """
        {"_items": [
                    {"title": "title One", "description": "Description", "blog_status": "open"},
                    {"title": "title Two", "description": "one", "blog_status": "open"}
                   ]}
        """

       @auth
    	Scenario: Delete blog
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given tenant aware "blogs"
        """
        [{"title": "test_blog1", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        When we post to "/blogs"
        """
           [{"title": "test_blog2", "blog_preferences": {"theme": "forest", "language": "fr"}}]
         """
        And we delete latest
        Then we get deleted response
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [
                    {"title": "test_blog1", "blog_status": "open"}
                   ]}
        """


		@auth
    	Scenario: Delete blog without being the owner
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
    	Given tenant aware "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given tenant aware "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty tenant aware "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we delete "/blogs/#blogs._id#"
        Then we get deleted response

        @auth
        Scenario: Adding blogs with or without members
        Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given empty tenant aware "users"
        When we post to "users"
            """
            {"first_name": "foo", "username": "foo_user", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
            """
        When we find for "users" the id as "user_foo" by "where={"username": "foo_user"}"
        Given empty tenant aware "blogs"
        When we post to "/blogs"
        """
        [
         {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "foo blog", "description": "blog with one member", "blog_status": "open", "members": [{"user": "#user_foo#"}]},
         {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "bar blog", "description": "blog without members", "blog_status": "open"}
        ]
        """
        And we get "/blogs"
        Then we get list with 2 items
        """
       	{"_items": [{"title": "bar blog"},{"title": "foo blog", "members": [{"user": "#user_foo#"}]}]}
        """
		When we get "/users/#user_foo#/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "members": [{"user": "#user_foo#"}]}]}
        """

    @auth
    @notification
    Scenario: Create new blog and get notification
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given empty tenant aware "users"
        Given empty tenant aware "blogs"
        When we post to "users"
            """
            {"first_name": "foo", "username": "foo", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
            """
        When we post to "/blogs"
            """
            {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Sports blog", "members": [{"user": "#users._id#"}]}
            """
        And we get "/blogs"
        Then we get list with 1 items
            """
            {"_items": [{"title": "Sports blog", "members": [{"user": "#users._id#"}]}]}
            """
        Then we get notifications
            """
            [{"event": "blog", "extra": {"created": 1, "blog_id": "#blogs._id#"}}]
            """

	@auth
    Scenario: Permission to open blogs
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given empty tenant aware "blogs"
        When we post to "blogs"
        """
        [{"title": "first blog", "members": [], "blog_preferences": {"theme": "forest", "language": "fr"}}
        ]
        """
        When we switch to user of type user
        And we get "/blogs/#blogs._id#"
        Then we get response code 403


	@auth
    @notification
    Scenario: Create new request for blog access and get notification
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
    	Given tenant aware "roles"
        """
        [{"name": "Contributor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1, "request_membership": 1}}]
        """
        Given tenant aware "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        When we login as user "foo" with password "barbar"
        Given empty tenant aware "blogs"
        When we post to "blogs"
        """
        [{"title": "Sports blog", "blog_status": "open", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        And we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "Sports blog", "original_creator": "#user_foo#"}]}
        """
        Given empty tenant aware "request_membership"
		When we post to "/request_membership"
		"""
        {"blog": "#blogs._id#", "original_creator": "#user_foo#"}
        """
        Then we get new resource
        """
        {"blog": "#blogs._id#", "original_creator": "#user_foo#"}
        """
        Then we get notifications
        """
        [{"event": "request", "extra": {"created": 1}}]
        """
        When we post to "/request_membership"
        """
        {"blog": "#blogs._id#"}
        """
        Then we get response code 400

    @auth
    Scenario: Check syndication_enabled
    	Given tenant aware "themes"
        """
        [{"name": "forest"}]
        """
        Given tenant aware "blogs"
        """
        [
           {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "testBlog1", "syndication_enabled": true},
           {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "testBlog2", "syndication_enabled": true},
           {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "testBlog3", "syndication_enabled": false}
         ]
        """
        When we get "/blogs?source={"query": {"filtered": {"filter": {"term": {"syndication_enabled": true}}}}}"
        Then we get list with 2 items
        """
        {"_items": [{"title": "testBlog1"}, {"title": "testBlog2"}]}
        """
        When we get "/blogs?source={"query": {"filtered": {"filter": {"term": {"syndication_enabled": false}}}}}"
        Then we get list with 1 items
        """
        {"_items": [{"title": "testBlog3"}]}
        """

    @auth
    Scenario: Blogs from different tenants are isolated
        Given "themes"
        """
        [{"name": "forest"}]
        """
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a blog
        When we login as tenant user "tenant1_admin"
        When we post to "blogs"
        """
        [{"title": "Tenant1 Blog", "blog_preferences": {"theme": "forest", "language": "en"}}]
        """
        Then we get OK response
        When we save "tenant1_blog_id" from last response "_id"

        # Tenant 2 cannot see Tenant 1's blogs in list
        When we login as tenant user "tenant2_admin"
        When we get "/blogs"
        Then we get list with 0 items

        # Tenant 2 cannot access Tenant 1's blog by ID
        When we get "/blogs/#tenant1_blog_id#"
        Then we get error 404

        # Tenant 2 cannot update Tenant 1's blog
        When we attempt to patch "/blogs/#tenant1_blog_id#"
        """
        {"title": "Hacked"}
        """
        Then we get error 404

        # Tenant 2 cannot delete Tenant 1's blog
        When we attempt to delete "/blogs/#tenant1_blog_id#"
        Then we get error 404