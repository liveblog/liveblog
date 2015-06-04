Feature: Themes operations

	@auth
    Scenario: List empty themes
        Given empty "themes"
        When we get "/themes"
        Then we get list with 0 items
        
        
    @auth
    Scenario: Add theme
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "forest"}]
        """  
        Then we get existing resource
        """
        {"name": "forest"}
        """  

	@auth
    Scenario: Delete theme
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "forest"}]
        """
        When we delete latest
        Then we get deleted response

	@auth
    Scenario: Assign a theme to a blog
        Given "themes"
        """
        [{"name": "forest"}]
        """
        When we post to "blogs"
		"""
		[{"title": "foo_blog", "theme": "#themes._id#"}]
		"""
		Then we get existing resource
		"""
		{"title": "foo_blog", "theme": "#themes._id#"}
		"""
