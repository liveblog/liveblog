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
        [{"title": "title One", "description": "description", "blog_status": "open"}]
        """  
        And we get "blogs?embedded={"original_creator":1}"
        Then we get list with 1 items
	    """
	    {"_items": [{"title": "title One", "description": "description", "blog_status": "open", "original_creator": {"username": "test_user"}}]}
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
    Scenario: Check blog_statuss
        Given "blogs"
        """
        [{"title": "testBlog", "blog_status": "closed"}, {"title": "testBlog2", "blog_status": "closed"}, {"title": "testBlog3", "blog_status": "open"}]
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
        Given "blogs"
        """
        [
         {"title": "title One", "description": "Description", "blog_status": "open"}, 
         {"title": "title Two", "description": "one", "blog_status": "open"}, 
         {"title": "Title three", "blog_status": "open"},
         {"title": "title one, two, three", "description": "description", "blog_status": "closed"}
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
        Scenario: Adding blogs with or without members
        Given empty "users"
        When we post to "users"
            """
            {"username": "foo_user", "email": "foo@bar.com", "is_active": true, "sign_off": "abc"}
            """
        When we find for "users" the id as "user_foo" by "{"username": "foo_user"}"
        Given "blogs"
        """
        [
         {"title": "foo blog", "description": "blog with one member", "blog_status": "open", "members": [{"user": "#user_foo#"}]}, 
         {"title": "bar blog", "description": "blog without members", "blog_status": "open"}
        ]
        """
        When we get "/blogs"
        Then we get list with 2 items
            """
            {"_items": [{"title": "bar blog"},{"title": "foo blog", "members": [{"user": "#user_foo#"}]}]}
            """
                When we get "/users/#user_foo#/blogs"
                Then we get list with 1 items
            """
            {"_items": [{"title": "foo blog", "members": [{"user": "#user_foo#"}]}]}
            """
