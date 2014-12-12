Feature: Blog operations

	@auth
    Scenario: List empty blogs
        Given empty "blogs"
        When we get "/blogs"
        Then we get list with 0 items
        
        
    @auth
    Scenario: Add blog
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"title": "title One", "description": "description", "state": "open"}]
        """  
        And we get "blogs?embedded={"original_creator":1}"
        Then we get list with 1 items
	    """
	    {"_items": [{"title": "title One", "description": "description", "state": "open", "original_creator": {"username": "test_user"}}]}
	    """
    
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
    Scenario: Search for blogs
        Given "blogs"
        """
        [
         {"title": "title One", "description": "description", "state": "open"}, 
         {"title": "title Two", "description": "one", "state": "open"}, 
         {"title": "Title three", "state": "open"},
         {"title": "title one, two, three", "description": "description", "state": "closed"}
        ]
        """
        
        When we get "/blogs?where={"state": "open", "$or":[{"title":{"$regex":"description","$options":"-i"}},{"description":{"$regex":"description","$options":"-i"}}]}"
        Then we get list with 1 items
	    """
	    {"_items": [{"title": "title One", "description": "description", "state": "open"}]}
	    """

        When we get "/blogs?where={"state": "open", "$or":[{"title":{"$regex":"One","$options":"-i"}}, {"description":{"$regex":"One","$options":"-i"}}]}"
        Then we get list with 2 items
	    """
	    {"_items": [
                    {"title": "title One", "description": "description", "state": "open"}, 
                    {"title": "title Two", "description": "one", "state": "open"} 
	               ]}
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
        [{"text": "test post for the same blog", "blog": "#BLOGS_ID#"}]
        """
        And we get "/posts?embedded={"original_creator":1}"
        Then we get list with 2 items
        """
        {"_items": [
                    {"text": "test post for an open blog", "blog": "#BLOGS_ID#", "original_creator": {"username": "test_user"}}, 
                    {"text": "test post for the same blog",  "blog": "#BLOGS_ID#", "original_creator": {"username": "test_user"}} 
	               ]}
	    """       
        
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
		
	@auth
    Scenario: Create items
    	Given empty "items"
    	Given "posts"
		"""
		[{"text": "test_post1"}]
		"""
		When we post to "items"
        """
        [{"headline": "test item for a post", "post": "#POSTS_ID#"}, {"headline": "test item for the same post", "post": "#POSTS_ID#"}]
        """
        And we get "/items?embedded={"original_creator":1}"
        Then we get list with 2 items
        """
        {"_items": [
                    {"headline": "test item for a post", "post": "#POSTS_ID#", "original_creator": {"username": "test_user"}}, 
                    {"headline": "test item for the same post", "post": "#POSTS_ID#", "original_creator": {"username": "test_user"}} 
	               ]}
	    """
	    
	@auth
    Scenario: Retrieve items from posts
        Given empty "items"
        Given "posts"
		"""
		[{"text": "test_post1"}]
		"""
        When we post to "posts"
	    """
	    [{"text": "test_post2"}]
	    """
        When we post to "items"
        """
        [{"headline": "test item for a post", "post": "#POSTS_ID#"}]
        """
        And we get "/posts/#POSTS_ID#/items"
		Then we get list with 1 items
