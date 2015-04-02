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

	Scenario: List empty client_items
        Given empty "client_items"
        When we get "/client_items"
        Then we get list with 0 items

	Scenario: List items without needing auth
        Given "client_items"
        """
        [{"text": "testItem", "type": "text"}]
        """
        When we get "/client_items"
        Then we get list with 1 items
        """
        {"_items": [{"text": "testItem", "type": "text"}]}
	    """
