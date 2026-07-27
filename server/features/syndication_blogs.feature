Feature: Syndication Blog Resource

    @auth
    Scenario: List blogs
        Given system themes
        Given tenant aware "blogs"
        """
        [
            {
                "title": "testBlog",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "classic", "language": "fr"}
            },
            {
                "title": "testBlog2",
                "blog_status": "open",
                "syndication_enabled": false,
                "blog_preferences": {"theme": "classic", "language": "fr"}
            },
            {
                "title": "testBlog3",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "classic", "language": "fr"}
            }
        ]
        """
        Given config consumer api_key
        When we get "/syndication/blogs/"
        Then we get list with 3 items

    @auth
    Scenario: Create, update and delete blog syndication
        Given system themes
        Given tenant aware "blogs" as item list
        """
        [
            {
                "title": "Producer Blog",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "classic", "language": "fr"}
            },
            {
                "title": "Consumer Blog",
                "blog_status": "open",
                "syndication_enabled": false,
                "blog_preferences": {"theme": "classic", "language": "fr"}
            }
        ]
        """
        Given config consumer api_key
        When we post to "/syndication/blogs/#blogs[0]._id#/syndicate/"
        """
        {
            "consumer_blog_id": "#blogs[1]._id#",
            "auto_retrieve": false
        }
        """
        Then we get response code 201
        When we patch to "/syndication/blogs/#blogs[0]._id#/syndicate/"
        """
        {
            "consumer_blog_id": "#blogs[1]._id#",
            "start_date": "2017-01-05T09:06:24+00:00",
            "auto_retrieve": true
        }
        """
        Then we get response code 200
