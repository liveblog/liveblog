Feature: Settings operations

    @auth
    Scenario: List empty global settings
        Given empty "global_preferences"
        When we get "/global_preferences"
        Then we get list with 0 items

    @auth
    Scenario: Add a global setting
        Given empty "global_preferences"
        When we post to "/global_preferences"
        """
        {"key": "language", "value": "fr"}
        """
        Then we get existing resource
        """
        {"key": "language", "value": "fr"}
        """
        When we get "/global_preferences"
        Then we get list with 1 items

    @auth
    Scenario: Delete a global setting
        Given empty "global_preferences"
        When we post to "global_preferences"
        """
        {"key": "language"}
        """
        When we delete latest
        Then we get deleted response

    @auth
    Scenario: Get the preferences
        When we post to "/global_preferences"
        """
        {"key": "language", "value": "fr"}
        """
        Given "blogs"
        """
        [{"title": "abc"}]
        """
        When we get "/blogs/#blogs._id#"
        Then we get default blog preferences

    @auth
    Scenario: Update theme preferences for a specific blog
        Given "blogs"
        """
        [{"title": "abc"}]
        """
        When we patch given
        """
        {"blog_preferences": {"theme": "railscast"}}
        """
        When we get "/blogs/#blogs._id#"
        Then we get existing resource
        """
        {
            "blog_preferences": {
                "theme": "railscast"
            }
        }
        """
