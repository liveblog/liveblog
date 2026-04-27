Feature: Syndication Blog Posts Resource

    @auth
    Scenario: List blog posts
        Given system themes
        Given tenant aware "blogs"
        """
        [
            {
                "title": "testBlog",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "classic", "language": "fr"},
                "members": [{"user": "#CONTEXT_USER_ID#"}]
            }
        ]
        """
        Given tenant aware "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "posts" with success
        """
        [{
            "blog": "#blogs._id#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ]
        }]
        """
        Given config consumer api_key
        When we get "/syndication/blogs/#blogs._id#/posts/"
        Then we get list with 1 items
