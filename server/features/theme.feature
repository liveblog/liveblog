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
    Scenario: Assign a theme to a blog
        Given "themes"
        """
        [{"name": "forest"}]
        """
        When we post to "blogs"
        """
        [{"title": "foo_blog", "blog_preferences": {"theme": "forest"}}]
        """
        Then we get existing resource
        """
        {"title": "foo_blog", "theme": {"name": "forest"}, "blog_preferences": {"theme": "forest"}}
        """


        @auth
        Scenario: Delete a theme
        Given "themes"
        """
        [{"name": "forest-theme", "version": "1.0.1"}, {"name": "default-theme", "version": "1.0.1"}]
        """
        When we find for "themes" the id as "my-theme" by "{"name": "forest-theme"}"
        Given empty "blogs"
        When we post to "/blogs"
        """
        [
         {"title": "foo blog", "blog_status": "open", "theme": {"name": "default-theme"}, "blog_preferences": {"theme": "default-theme"}}
        ]
        """
        And we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "theme": {"name": "default-theme"}}]}
        """
        When we patch "/blogs/#blogs._id#"
        """
        {"theme": {"name": "forest-theme"}}
        """
        Then we get updated response
        When we delete "/themes/#my-theme#"
        Then we get deleted response
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "theme": {"name": "default-theme"}}]}
        """
