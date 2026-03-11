Feature: Client modules operations

    @auth
    Scenario: List a single client_blog
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "classic", "language": "fr"}, "title": "test_blog"}]
        """
        When we save "blog_id" from last response "_id"
        When we get "/client_blogs/#blog_id#"
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

    @auth
    Scenario: List posts as authenticated tenant user
        Given empty "archive"
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "testBlog one", "blog_preferences": {"theme": "classic", "language": "fr"}}]
        """
        When we post to "posts"
        """
        [{"headline": "testPost one", "blog": "#blogs._id#"}, {"headline": "testPost two", "blog": "#blogs._id#"}]
        """
        When we get "/client_posts"
        Then we get list with 2 items
        """
        {"_items": [{"headline": "testPost one"}, {"headline": "testPost two"}]}
        """

    @auth
    Scenario: List a single client_post
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "testBlog one", "blog_preferences": {"theme": "classic", "language": "fr"}}]
        """
        When we post to "posts"
        """
        [{"guid": "post-1", "headline": "test_post", "blog": "#blogs._id#"}]
        """
        When we get "/client_posts/#posts._id#"
        Then we get existing resource
        """
        {"post_status": "open", "guid": "post-1", "headline": "test_post"}
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

    @auth
    Scenario: Posting a comment
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"
        When we post to "blogs"
        """
        [{"title": "test_blog_comment", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        Given empty "client_items"
        When we post to "/client_items"
        """
        [
            {"text": "test item comment", "commenter": "ana", "client_blog": "#blogs._id#"}
        ]
        """
        And we get "/client_items/#client_items._id#"
        Then we get existing resource
        """
        {"text": "test item comment", "commenter": "ana", "client_blog": "#blogs._id#"}
        """
        When we post to "/client_comments"
        """
        {
            "post_status": "comment",
            "client_blog": "#blogs._id#",
        	"groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "residRef": "#client_items._id#"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ]
        }
        """
        Then we get OK response
