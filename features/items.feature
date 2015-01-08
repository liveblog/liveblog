Feature: Items operations

	@auth
    Scenario: List empty items
        Given empty "items"
        When we get "/items"
        Then we get list with 0 items
        
        
    @auth
    Scenario: Add item
        Given empty "items"
        Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        When we post to "items"
        """
        [{"text": "test item for an open blog", "blog": "#BLOGS_ID#"}]
        """  
        Then we get existing resource
        """
        {"text": "test item for an open blog", "blog": "#BLOGS_ID#"}
        """  
        When we get "items?embedded={"original_creator":1}"
        Then we get list with 1 items
	    """
	    {"_items": [{"text": "test item for an open blog", "blog": "#BLOGS_ID#"}]}
	    """
	    
		
	@auth
    Scenario: Update item
        Given "items"
        """
        [{"headline": "testItem"}]
        """
        When we patch given
        """
        {"text": "this is a test item"}
        """
        And we patch latest
        """
        {"text":"the test of the test"}
        """
        Then we get updated response

   
#     @auth
#     Scenario: Retrieve items from posts
#         Given empty "items"
#         Given "posts"
#         """
#         [{"text": "test_post1"}]
#         """
#         When we post to "posts"
#         """
#         [{"text": "testPost"}]
#         """
#         When we post to "items"
#         """
#         [{"headline": "test item for a given post", "post": "#POSTS_ID#"}]
#         """
#         And we get "/posts/#POSTS_ID#/items"
#         Then we get list with 1 items
		