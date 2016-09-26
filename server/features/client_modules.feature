Feature: Client modules operations

    Scenario: List empty client_blogs
        Given empty "blogs"
        When we get "/client_blogs"
        Then we get list with 0 items

    Scenario: List blogs without needing auth
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
        """
        [{"title": "testBlog one", "blog_preferences": {"theme": "forest", "language": "fr"}}, {"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "testBlog two"}]
        """
        When we get "/client_blogs"
        Then we get list with 2 items
        """
        {"_items": [{"title": "testBlog one", "blog_status": "open"}, {"title": "testBlog two"}]}
        """

	Scenario: List a single client_blog
		Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "guid": "blog-1", "title": "test_blog"}]
        """
        When we get "/client_blogs/#blogs._id#"
        Then we get existing resource
        """
        {"title": "test_blog"}
        """

    # NOTE: commented because it trigger an error that is solved by adding
    # {order: {order: 'desc', missing:'_last', unmapped_type: 'long'}} to the request.
    # see: http://stackoverflow.com/questions/17051709/no-mapping-found-for-field-in-order-to-sort-on-in-elasticsearch
    # Scenario: List empty client_posts
    #     Given empty "posts"
    #     When we get "/client_posts"
    #     Then we get list with 0 items

    Scenario: List posts without needing auth
    	Given "themes"
        """
        [{"name": "forest"}]
        """
    	Given "blogs"
        """
        [{"title": "testBlog one", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        Given "posts"
        """
        [{"headline": "testPost one", "blog": "#blogs._id#"}, {"headline": "testPost two", "blog": "#blogs._id#"}]
        """
        When we get "/client_posts"
        Then we get list with 2 items
        """
        {"_items": [{"headline": "testPost one"}, {"headline": "testPost two"}]}
        """

    Scenario: List a single client_post
    	Given "themes"
        """
        [{"name": "forest"}]
        """
    	Given "blogs"
        """
        [{"title": "testBlog one", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        Given "posts"
        """
        [{"guid": "post-1", "headline": "test_post", "blog": "#blogs._id#"}]
        """
        When we get "/client_posts/#posts._id#"
        Then we get existing resource
        """
        {"post_status": "open", "guid": "post-1", "headline": "test_post"}
        """

    Scenario: List empty client_users
        Given empty "users"
        When we get "/client_users"
        Then we get list with 0 items

    Scenario: List users without needing auth
        Given "users"
        """
        [{"username": "test-user", "first_name": "Test", "last_name": "User1"}, {"username": "test-user 2", "first_name": "Test2", "last_name": "User2"}]
        """
        When we get "/client_users"
        Then we get list with 2 items
        """
        {"_items": [{"display_name": "Test User1"}, {"display_name": "Test2 User2"}]}
        """

    Scenario: List a single client_user
        Given "users"
        """
        [{"username": "foo", "first_name": "Foo", "last_name": "Bar"}]
        """
        When we get "/client_users/#users._id#"
        Then we get existing resource
        """
        {"display_name": "Foo Bar"}
        """

    Scenario: Posting a comment
        Given "client_blogs"
        """
        [{"guid": "blog-1", "title": "test_blog_comment"}]
        """
        Given empty "client_items"
       	When we post to "/client_items"
        """
        [
         {"text": "test item comment", "commenter": "ana", "client_blog": "#client_blogs._id#"}
        ]
        """
        And we get "/client_items/#client_items._id#"
        Then we get existing resource
        """
        {"text": "test item comment", "commenter": "ana", "client_blog": "#client_blogs._id#"}
        """
        When we post to "/client_comments"
        """
        {"client_blog": "#client_blogs._id#",
        	"groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "comment post",
                            "residRef": "#client_items._id#",
                            "slugline": "awesome comment"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605"
        }
        """
        When we get "/client_comments"
        Then we get list with 1 items
        """
        {"_items": [{"original_creator": "", "post_status": "comment", "client_blog": "#client_blogs._id#"}]}
        """
