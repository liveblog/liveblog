Feature: Syndication Blog Resource

    Scenario: List blogs
        Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
        """
        [
            {
                "title": "testBlog",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "forest", "language": "fr"}
            },
            {
                "title": "testBlog2",
                "blog_status": "open",
                "syndication_enabled": false,
                "blog_preferences": {"theme": "forest", "language": "fr"}
            },
            {
                "title": "testBlog3",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "forest", "language": "fr"}
            }
        ]
        """
        Given config consumer api_key
        When we get "/syndication/blogs/"
        Then we get list with 3 items
