Feature: Items operations

	@auth
    Scenario: List empty items
        Given empty "items"
        When we get "/items"
        Then we get list with 0 items
        
        
    @auth
    Scenario: Add item
        Given empty "items"
        When we post to "items"
        """
        [{"headline": "item 1"}]
        """  
        And we get "items?embedded={"original_creator":1}"
        Then we get list with 1 items
	    """
	    {"_items": [{"headline": "item 1"}]}
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
	    [{"text": "testPost"}]
	    """
        When we post to "items"
        """
        [{"headline": "test item for a given post", "post": "#POSTS_ID#"}]
        """
        And we get "/posts/#POSTS_ID#/items"
		Then we get list with 1 items
		
	@auth
    Scenario: Update item
        Given "items"
        """
        [{"headline": "testItem"}]
        """
        When we patch given
        """
        {"headline": "this is a test item"}
        """
        And we patch latest
        """
        {"headline":"the test of the test"}
        """
        Then we get updated response
