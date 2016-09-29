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
    Scenario: Upload a theme with satisfied dependencies
        Given "themes"
        """
        [{"name": "angular"}]
        """
        When we upload a file "dog-theme.zip" to "theme-upload"
        When we get "/themes"
        Then we get list with 2 items
        """
        {"_items": [{"name": "angular"}, {"name": "actual-dog"}]}
        """

        @auth
        Scenario: Delete a theme
        Given "global_preferences"
        """
        [{"key": "theme", "value": "classic"}]
        """
        When we get "/global_preferences"
        Then we get list with 1 items
        """
        {"_items": [{"key": "theme", "value": "classic"}]}
        """
        Given "themes"
        """
        [{"name": "forest-theme", "version": "1.0.1", "extends": "ocean-theme"}, {"name": "ocean-theme", "version": "2.0.1"}, {"name": "classic", "version": "1.0.1", "extends": "forest-theme"}]
        """
        When we find for "themes" the id as "my-forest-theme" by "where={"name": "forest-theme"}"
        When we find for "themes" the id as "my-ocean-theme" by "where={"name": "ocean-theme"}"
        When we find for "themes" the id as "my-classic" by "where={"name": "classic"}"
        Given empty "blogs"
        When we post to "/blogs"
        """
        [
         {"title": "foo blog", "blog_status": "open", "blog_preferences": {"theme": "classic"}}
        ]
        """
        And we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "blog_preferences": {"theme": "classic"}}]}
        """
        When we patch "/blogs/#blogs._id#"
        """
        {"blog_preferences": {"theme": "other-theme"}}
        """
        Then we get updated response
        When we delete "themes/#my-classic#"
        Then we get response code 403
        When we delete "/themes/#my-forest-theme#"
        Then we get response code 403
        When we delete "/themes/#my-ocean-theme#"
        Then we get response code 403
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "blog_preferences": {"theme": "other-theme"}}]}
        """

        @auth
        Scenario: Overwrite theme_settings at blog level
        Given "themes"
        """
        [{"name": "angular", "version": "1.0.1"}, {"name": "classic", "extends": "angular", "options": [{"name": "postsPerPage", "default": "22"}, {"name": "postOrder", "default": "editorial"}]}]
        """
        When we find for "themes" the id as "my-classic" by "where={"name": "classic"}"
        When we get "/themes"
        Then we get list with 2 items
        Given empty "blogs"
        When we post to "/blogs"
        """
        [
         {"title": "foo blog", "blog_status": "open", "blog_preferences": {"theme": "classic"}}
        ]
        """
        And we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "theme_settings": {"postsPerPage": "22", "postOrder": "editorial"}, "blog_preferences": {"theme": "classic"}}]}
        """
        When we patch "/blogs/#blogs._id#"
        """
        {"theme_settings": {"postsPerPage": "25"}}
        """
        Then we get updated response
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "theme_settings": {"postsPerPage": "25", "postOrder": "editorial"}}]}
        """
        When we register "classic"
        When we get "/blogs"
        Then we get list with 1 items
        """
        {"_items": [{"title": "foo blog", "theme_settings": {"postsPerPage": "25", "postOrder": "editorial"}}]}
        """
        
        @auth
        Scenario: Overwrite default theme_settings
        Given "themes"
        """
        [{"name": "angular", "version": "1.0.1"}, {"name": "classic", "extends": "angular", "options": [{"name": "postsPerPage", "default": "22"}, {"name": "postOrder", "default": "editorial"}]}]
        """
        When we find for "themes" the id as "my-classic" by "where={"name": "classic"}"
        When we patch "/themes/#my-classic#"
        """
        {"options": [{"name": "postsPerPage", "default": "30"}]}
        """
        Then we get new resource
        """
        {"name": "classic", "options": [{"name": "postsPerPage", "default": "30"}]}
        """
        When we register "classic"
        And we get "/themes/#my-classic#"
        Then we get existing resource
        """
        {"name": "classic", "options": [{"name": "postsPerPage", "default": "30"}]}
        """
