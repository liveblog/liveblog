Feature: Items operations

	@auth
    Scenario: List empty items
        Given empty "items"
        When we get "/items"
        Then we get list with 0 items


    @auth
    Scenario: Add item
		Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Contributor" role
        Given empty "items"
        Given we have "user" as type of user
        Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        When we post to "items"
        """
        [{"text": "test item for an open blog", "blog": "#blogs._id#"}]
        """
        Then we get existing resource
        """
        {"text": "test item for an open blog", "blog": "#blogs._id#"}
        """
        When we get "items?embedded={"original_creator":1}"
        Then we get list with 1 items
	    """
	    {"_items": [{"text": "test item for an open blog", "blog": "#blogs._id#"}]}
	    """


	@auth
    Scenario: Update item
		Given "roles"
		"""
		[{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
		"""
		Given we have "Contributor" role
		Given we have "user" as type of user
    	Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
       When we post to "items"
        """
        [{"text": "test item for an open blog", "blog": "#blogs._id#"}]
        """
        When we patch latest
        """
        {"text": "this is a test item"}
        """
        And we patch latest
        """
        {"text":"the test of the test"}
        """
        Then we get updated response

	@auth
    Scenario: Delete item
		Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Contributor" role
		Given we have "user" as type of user
        Given empty "items"
        Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        When we post to "items"
        """
        [{"text": "test item", "blog": "#blogs._id#"}]
        """
        When we delete latest
        Then we get deleted response
