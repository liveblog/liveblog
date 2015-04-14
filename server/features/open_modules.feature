Feature: Open modules operations

    Scenario: List empty client_blogs
        Given empty "client_blogs"
        When we get "/client_blogs"
        Then we get list with 0 items

	Scenario: List blogs without needing auth
        Given "client_blogs"
        """
        [{"title": "testBlog"}]
        """
        When we get "/client_blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "testBlog", "blog_status": "open"}]}
	    """

	Scenario: List empty client_posts
        Given empty "client_posts"
        When we get "/client_posts"
        Then we get list with 0 items

	Scenario: List posts without needing auth
        Given "client_posts"
        """
        [{"headline": "testPost"}]
        """
        When we get "/client_posts"
        Then we get list with 1 items
        """
        {"_items": [{"headline": "testPost"}]}
	    """

	Scenario: List a single client_blog or a single client_post
       	Given "blogs"
        """
        [{"guid": "blog-1", "title": "test_blog"}]
        """
        When we get "/client_blogs/#blogs._id#"
        Then we get existing resource
        """
        {"title": "test_blog"}
        """
        Given lb "posts"
        """
        [{"guid": "post-1", "headline": "test_post"}]
        """
        When we get "/client_posts/post-1"
        Then we get existing resource
        """
        {"post_status": "open", "guid": "post-1"}
        """
        
	Scenario: List post for client_blogs depending on_the_request
		Given "blogs"
        """
        [{"title": "bl1", "guid": "blog-1"}]
        """
        Given lb "posts"
        """
        [{"guid": "post-1", "blog": "#blogs._id#", "post_status": "draft"}]
        """
        When we get "/client_posts/post-1"
        Then we get existing resource
        """
        {"post_status": "draft", "blog": "#blogs._id#"}
        """
		When we get "/client_blogs/#blogs._id#/posts?status=draft"
		Then we get list with 1 items
        """
        {"_items": [{"guid": "post-1"}]}
	    """
	    When we get "/client_blogs/#blogs._id#/posts?status=open"
		Then we get list with 0 items
        """
        {"_items": [{}]}
	    """

	Scenario: posts from prepopulate
        When we get "/client_posts"
        Then we get list with 1 items

        
	Scenario: abc
        When we get the "/blogs" by "-id blog one-"
        Then we get existing resource
        """
        {"title": "test-blog1"}
        """
