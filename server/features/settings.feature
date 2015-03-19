Feature: Settings operations

	@auth
    Scenario: List empty global settings
        Given empty "global_preferences"
        When we get "/global_preferences"
        Then we get list with 0 items
        
        
	@auth
    Scenario: Get the preferences
        Given "blogs"
        """
        [{"title": "abc"}]
        """
        When we get "/blog_preferences/#blogs._id#"
        Then we get blog preferences

	@auth
    Scenario: Update theme preferences for a specific blog
         Given "blogs"
        """
        [{"title": "abc"}]
        """
        When we patch given
        """
        {"blog_preferences": {"themes:set": {"theme": "railscast"}}}
        """

        When we get "/blog_preferences/#blogs._id#"
        Then we get existing resource
        """
        {
            "blog_preferences": {
                "themes:set": {
                    "theme": "railscast"
                }
            },
            "global_settings": {
                "languages:set": {
                    "lang": "en"
                }
            }
        }
        """