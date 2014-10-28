Feature: Blog operations

	@auth
    Scenario: List empty blogs
        Given empty "blogs"
        When we get "/blogs"
        Then we get list with 0 items
        
    @auth
    Scenario: Create new blog
        Given empty "blogs"
        When we post to "blogs"
	    """
	    [{"name": "testBlog", "language": "en"}]
	    """
        And we get "/blogs"
        Then we get list with 1 items
	    """
	    {"_items": [{"name": "testBlog", "language": "en", "state": "open"}]}
	    """
	    
	@auth
    Scenario: Update blog
        Given "blogs"
        """
        [{"name": "testBlog"}]
        """
        When we patch given
        """
        {"description": "this is a test blog"}
        """
        And we patch latest
        """
        {"description":"the test of the test"}
        """
        Then we get updated response
        
    @auth
    Scenario: Check states
        Given "blogs"
        """
        [{"name": "testBlog", "state": "closed"}, {"name": "testBlog2", "state": "closed"}, {"name": "testBlog3", "state": "open"}]
        """
        When we get "/blogs?where={"state": "closed"}"
        Then we get list with 2 items
	    """
	    {"_items": [{"name": "testBlog"}, {"name": "testBlog2"}]}
	    """
	    When we get "/blogs?where={"state": "open"}"
	    Then we get list with 1 items
	    """
	    {"_items": [{"name": "testBlog3"}]}
	    """

   	@auth
    Scenario: Delete blog
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"name": "testBlog"}]
        """
        And we delete latest
        Then we get deleted response

	@auth
    Scenario: Create posts
    	Given empty "blogs"
        Given empty "posts"
        When we post to "blogs"
	    """
	    [{"name": "testBlog", "language": "en"}]
	    """
        When we post to "posts"
        """
        [{"text": "test post for an open blog", "blog": "#BLOGS_ID#"}]
        """
        When we post to "posts"
        """
        [{"text": "test post for the same blog",  "blog": "#BLOGS_ID#"}]
        """
        And we get "/posts"
        Then we get list with 2 items
        
	@auth
    Scenario: Retrieve posts from blogs
    	Given empty "blogs"
        Given empty "posts"
        When we post to "blogs"
	    """
	    [{"name": "testBlog", "language": "fr"}]
	    """
        When we post to "posts"
        """
        [{"text": "test post for an open blog", "blog": "#BLOGS_ID#"}]
        """
        And we get "/blogs/#BLOGS_ID#/posts"
		Then we get list with 1 items
