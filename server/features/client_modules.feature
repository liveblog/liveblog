Feature: Client modules operations

    Scenario: List empty client_blogs
        Given empty "blogs"
        When we get "/client_blogs"
        Then we get list with 0 items

	Scenario: List blogs without needing auth
        Given "blogs"
        """
        [{"title": "testBlog one"}, {"title": "testBlog two"}]
        """
        When we get "/client_blogs"
        Then we get list with 2 items
        """
        {"_items": [{"title": "testBlog one", "blog_status": "open"}, {"title": "testBlog two"}]}
	    """

	Scenario: List a single client_blog
       	Given "blogs"
        """
        [{"guid": "blog-1", "title": "test_blog"}]
        """
        When we get "/client_blogs/#blogs._id#"
        Then we get existing resource
        """
        {"title": "test_blog"}
        """

	Scenario: List a single client_post
        Given "posts"
        """
        [{"guid": "post-1", "headline": "test_post"}]
        """
        When we get "/client_posts/#posts._id#"
        Then we get existing resource
        """
        {"post_status": "open", "guid": "post-1", "headline": "test_post"}
        """

	Scenario: List empty client_users
        Given empty "users"
        When we get "/client_users"
        Then we get list with 0 items

	Scenario: List users without needing auth
        Given "users"
        """
        [{"username": "test-user"}, {"username": "test-user 2"}]
        """
        When we get "/client_users"
        Then we get list with 2 items
        """
        {"_items": [{"username": "test-user"}, {"username": "test-user 2"}]}
	    """

	Scenario: List a single client_user
        Given "users"
        """
        [{"username": "foo"}]
        """
        When we get "/client_users/#users._id#"
        Then we get existing resource
        """
        {"username": "foo"}
        """
	Scenario: List posts for client_blogs
        When we post to "/prepopulate"
        """
        {"profile": "app_prepopulate_data_test"}
        """
        Then we get new resource
        """
        {"_status": "OK"}
        """
        When we find for "client_blogs" the id as "b1" by "{"title": "blog-test-1"}"
        Then we get list with 1 items
        """
        {"_items": [{"title": "blog-test-1"}]}
        """
        When we get "/client_blogs/#b1#/posts"
        Then we get list with 1 items
        """
        {"_items": [{"post_status": "open", "blog": "#b1#"}]}
            """
        