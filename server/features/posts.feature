Feature: Post operations

    @auth
    Scenario: Create and publish a posts with Editor permissions
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items" with success
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome post"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605",
            "blog": "#blogs._id#"
        }
        """
        And we get "/posts"
        Then we get list with 1 items

    @auth
    Scenario: Create posts without permissions
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        When we login as user "foo" with password "bar"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        Given "blogs"
        """
        [{"title": "TEST_BLOG", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        Then we get response code 403

    @auth
    Scenario: Create and publish a post with Contributor permissions
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"title": "Delete blog without being the owner", "blog_preferences": {"theme": "forest", "language": "fr"}, "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "items" with success
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts"
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome post"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605",
            "blog": "#blogs._id#"
        }
        """
        Then we get response code 403


    @auth
    Scenario: Create posts and save it as draft with Contributor permissions
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "items" with success
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
            "post_status": "draft",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome post"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605",
            "blog": "#blogs._id#"
        }
        """
        And we get "/posts"
        Then we get list with 1 items


    @auth
    Scenario: Submit posts with Contributor permissions
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "items" with success
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
            "post_status": "submitted",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome post"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605",
            "blog": "#blogs._id#"
        }
        """
        And we get "/posts"
        Then we get list with 1 items

    @auth
    Scenario: Retrieve posts from blog
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
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
        }
        """
        And we get "/blogs/#blogs._id#/posts"
        Then we get list with 1 items
        """
        {
            "_items": [
                {
                    "groups": [
                        {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                        {
                            "id": "main",
                            "refs": [
                                {
                                    "headline": "test post with text",
                                    "residRef": "#items._id#",
                                    "slugline": "awesome article",
                                     "item": {
                                        "text": "test",
                                        "particular_type": "item",
                                        "type": "text"
                                    }
                                }
                            ],
                            "role": "main"
                        }
                    ],
                    "blog": "#blogs._id#"
                }
            ]
        }
        """

    @auth
    Scenario: Patch created post
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we upload a file "bike.jpg" to "archive"
        When we post to "/posts" with success
        """
        {
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
        }
        """
        And we patch latest
        """
        {
            "blog": "#blogs._id#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with pic",
                            "residRef": "#archive._id#",
                            "slugline": "awesome picture"
                        },
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ]
        }
        """
        Then we get existing resource
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test post with pic",
                            "residRef": "#archive._id#",
                            "slugline": "awesome picture"
                        },
                        {
                            "headline": "test post with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ],
            "type": "composite",
            "blog": "#blogs._id#"
        }
        """

    @auth
    Scenario: Full scenario to prove cid is working
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        [{"headline": "testPost", "blog": "#blogs._id#"}]
        """
        And we patch latest
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "main"
                }
            ]
        }
        """
        Then we get existing resource
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "main"
                }
            ],
            "type": "composite",
            "blog": "#blogs._id#"
        }
        """
        When we get "/items"
        Then we get list with 1 items
        """
        {"_items": [{"text": "test", "blog": "#blogs._id#"}]}
        """
        When we patch "/items/#items._id#"
        """
        {"text": "this is a test item to check cid"}
        """
        Then we get updated response
        When we get "/items"
        Then we get list with 1 items
        """
        {"_items": [{"text": "this is a test item to check cid", "blog": "#blogs._id#"}]}
        """
        When we delete "/items/#items._id#"
        Then we get deleted response

    @auth
    Scenario: Delete post
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test item", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
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
        }
        """
        When we delete latest
        Then we get deleted response

    @auth
    Scenario: Delete item from post i.e. update post
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
            "blog": "#blogs._id#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "residRef": "#items._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ]
        }
        """
        And we patch latest
        """
        {
            "blog": "#blogs._id#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                    ],
                    "role": "main"
                }
            ]
        }
        """
        Then we get existing resource
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                    ],
                    "role": "main"
                }
            ],
            "type": "composite",
            "blog": "#blogs._id#"
        }
        """
        When we get "/items"
        Then we get list with 1 items
        """
        {"_items": [{"text": "test", "linked_in_packages": []}]}
        """

	@auth
    Scenario: Retrieve private drafts
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
    	"""
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "test_blog1"}]
        """
    	Given "users"
    	"""
        [{"username": "admin"}]
        """
        When we get "/users"
        Then we get list with 2 items
        """
        {"_items": [{"username":"admin"},
              		    {"username": "test_user"}]}
        """
        When we find for "users" the id as "user_admin" by "where={"username": "admin"}"

        Given "posts"
        """
        [{"headline": "first post", "blog": "#blogs._id#", "post_status": "open", "original_creator": "#user_admin#"},
        {"headline": "second post", "blog": "#blogs._id#", "post_status": "open", "original_creator": "#user_admin#"},
        {"headline": "first draft", "blog": "#blogs._id#", "post_status": "draft", "original_creator": "#user_admin#"}
        ]
        """

		When we setup test user

        When we get "/blogs/#blogs._id#/posts"
        Then we get list with 2 items
        """
        {"_items": [{"headline": "first post", "blog": "#blogs._id#", "post_status": "open"},
        			   {"headline": "second post", "blog": "#blogs._id#", "post_status": "open"}]}
        """

	@auth
    Scenario: Post published date
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "Delete blog without being the owner", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items"
        """
        [{"text": "test one", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
            "blog": "#blogs._id#",
            "headline": "first post",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "main"
                }
            ]
        }
        """
        Then we get new resource
        """
        {"firstcreated": "__any_value__", "post_status": "open", "blog": "#blogs._id#", "headline": "first post"}
        """

    @auth
    Scenario: Published date on posts that were drafts
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1, "submit_post": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "test_blog3"}]
        """
        Given "posts"
        """
        [{"headline": "my draft will be published", "post_status": "draft", "blog": "#blogs._id#"}]
        """
        When we patch given
        """
        {
            "post_status": "open"
        }
        """
        Then we get new resource
        """
        {"post_status": "open", "published_date": "__any_value__", "blog": "#blogs._id#", "headline": "my draft will be published"}
        """
        When we patch latest
        """
        {
            "post_status": "draft",
            "unpublished_date":"2015-06-22T11:53:58+00:00"
        }
        """
        Then we get new resource
        """
        {"post_status": "draft", "published_date": "__any_value__", "blog": "#blogs._id#", "headline": "my draft will be published", "unpublished_date":"__any_value__"}
        """

	@auth
    Scenario: Published date on posts comming from submitted contributions
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1, "submit_post": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "test_blog3"}]
        """
        Given "posts"
        """
        [{"headline": "my contribution will be published", "post_status": "submitted", "blog": "#blogs._id#"}]
        """
        When we patch given
        """
        {
            "post_status": "open"
        }
        """
        Then we get new resource
        """
        {"post_status": "open", "blog": "#blogs._id#", "headline": "my contribution will be published"}
        """

 	@auth
    Scenario: Create a sticky post
        Given "themes"
        """
        [{"name": "forest"}]
        """
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given "users"
        """
        [{"username": "foo", "email": "foo@bar.com", "is_active": true, "role": "#roles._id#", "password": "barbar"}]
        """
        When we find for "users" the id as "user_foo" by "where={"username": "foo"}"
        Given empty "blogs"
        When we post to "blogs"
        """
        [{"blog_preferences": {"theme": "forest", "language": "fr"}, "title": "StickyBlog", "members": [{"user": "#user_foo#"}]}]
        """
        When we login as user "foo" with password "barbar"
        When we post to "items" with success
        """
        [{"text": "sticky test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
        "blog": "#blogs._id#",
        "post_status": "open",
        "sticky": true,
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "sticky post with text",
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ]
        }
        """
        And we get "/posts"
        Then we get list with 1 items
        """
        {"_items": [{"lb_highlight": false, "sticky": true, "blog": "#blogs._id#", "post_status": "open", "order": 0}]}
        """

    @auth
    Scenario: Update sticky post and order according to timestamp
        Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
        """
        [{"title": "test_blog3", "blog_preferences": {"theme": "forest", "language": "fr"}}]
        """        
        When we post to "items" with success
        """
        [{"text": "open test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
        "blog": "#blogs._id#",
        "post_status": "open",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "open post with text",
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ]
        }
        """
        When we post to "items" with success
        """
        [{"text": "draft test", "blog": "#blogs._id#"}]
        """
        When we post to "/posts" with success
        """
        {
        "blog": "#blogs._id#",
        "post_status": "draft",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "draft post with text",
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ]
        }
        """
        When we post to "items" with success
        """
        [{"text": "sticky test", "blog": "#blogs._id#"}]
        """
         When we post to "/posts" with success
        """
        {
        "blog": "#blogs._id#",
        "post_status": "open",
        "sticky": true,
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "sticky post with text",
                            "residRef": "#items._id#"
                        }
                    ],
                    "role": "grpRole:Main"
                }
            ]
        }
        """
        When we get "/posts"
        Then we get list with 3 items
        """
        {"_items": [{"post_status":"open", "sticky": true, "order": 2}, {"post_status":"open", "order": 0}, {"post_status":"draft", "order": 1}]}
        """      
        When we patch "posts/#posts._id#"
        """
        {
            "sticky": false
        }
        """
        Then we get new resource
        """
        {"post_status": "open", "sticky": false,"blog": "#blogs._id#", "order": 2}
        """   
