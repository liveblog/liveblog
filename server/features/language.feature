Feature: Language operations

    @auth
    Scenario: List empty languages
        Given empty "languages"
        When we get "/languages"
        Then we get list with 0 items
        
        
    @auth
    Scenario: Add language
        Given empty "languages"
        When we post to "languages"
        """
        [{"language_code": "en"}]
        """  
        Then we get existing resource
        """
        {"name": "english"}
        """  

    @auth
    Scenario: Delete language
        Given empty "languages"
        When we post to "languages"
        """
        [{"language_code": "fr"}]
        """
        When we delete latest
        Then we get deleted response

    @auth
    Scenario: Assign a language to a blog
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "languages"
        """
        [{"language_code": "fr"}]
        """
        When we post to "blogs"
        """
        [{"title": "test_blog1", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        Then we get existing resource
        """
        {"title": "test_blog1", "blog_preferences": {"language": "fr"}}
        """
