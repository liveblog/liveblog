Feature: Blog operations

	@auth
    Scenario: List empty blogs
        Given empty "blogs"
        When we get "/blogs"
        Then we get list with 0 items
        
    
	@auth
    Scenario: Update blog
        Given "blogs"
        """
        [{"title": "testBlog"}]
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
        [{"title": "testBlog", "state": "closed"}, {"title": "testBlog2", "state": "closed"}, {"title": "testBlog3", "state": "open"}]
        """
        When we get "/blogs?where={"state": "closed"}"
        Then we get list with 2 items
	    """
	    {"_items": [{"title": "testBlog"}, {"title": "testBlog2"}]}
	    """
	    When we get "/blogs?where={"state": "open"}"
	    Then we get list with 1 items
	    """
	    {"_items": [{"title": "testBlog3"}]}
	    """

   	@auth
	Scenario: Delete blog
		Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
		When we post to "/blogs"
        """
       	[{"title": "test_blog2"}]
		 """
        And we delete latest
        Then we get deleted response


	@auth
    	Scenario: Create posts
    	Given empty "posts"
    	Given "blogs"
		"""
		[{"title": "test_blog1"}]
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
        Given empty "posts"
        Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        When we post to "blogs"
	    """
	    [{"title": "testBlog", "language": "fr"}]
	    """
        When we post to "posts"
        """
        [{"text": "test post for an open blog", "blog": "#BLOGS_ID#"}]
        """
        And we get "/blogs/#BLOGS_ID#/posts"
		Then we get list with 1 items
