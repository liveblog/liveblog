Feature: Open modules operations

    Scenario: List empty client_blogs
        Given empty "blogs"
        When we get "/client_blogs"
        Then we get list with 0 items

	Scenario: List blogs without needing auth
        Given "blogs"
        """
        [{"title": "testBlog"}]
        """
        When we get "/client_blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "testBlog", "blog_status": "open"}]}
	    """

	Scenario: List empty client_posts
        Given empty "posts"
        When we get "/client_posts"
        Then we get list with 0 items

	Scenario: List posts without needing auth
        Given "posts"
        """
        [{"headline": "testPost"}]
        """
        When we get "/client_posts"
        Then we get list with 1 items
        """
        {"_items": [{"headline": "testPost"}]}
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
        
	Scenario: List post for client_blogs depending on_the_request
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
        When we get "/client_blogs/#b1#/posts?status=open"
       	Then we get list with 1 items
        """
        {"_items": [{"post_status": "open", "blog": "#b1#"}]}
	    """
	    When we get "/client_blogs/#b1#/posts?status=draft"
	    Then we get list with 0 items
        """
        {"_items": [{}]}
	    """
