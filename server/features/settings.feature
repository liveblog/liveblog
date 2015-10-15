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
    Scenario: The blog preference takes the global preferences
        Given empty "global_preferences"
        When we post to "/global_preferences"
        """
        [{"key": "language", "value": "fr"}, {"key": "theme", "value": "theme1"}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "{"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"title": "abc", "original_creator": "#user_foo#"}]
        """
        When we get "/blogs/#blogs._id#"
        Then we get existing resource
        """
        {
            "blog_preferences": {
                "language": "fr",
                "theme": "theme1"
            }
        }
        """


    @auth
    Scenario: Update theme preferences for a specific blog
        When we post to "blogs"
        """
        [{"title": "abc"}]
        """
        When we patch latest
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
