Feature: Post operations

    @auth
    Scenario: Create and publish a posts with Editor permissions
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "TEST_BLOG"}]
        """
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
            "guid": "tag:example.com,0000:newsml_BRE9A605"
        }
        """
        And we get "/posts"
        Then we get list with 1 items

    @auth
    Scenario: Create posts without permissions
        Given empty "posts"
        Given empty "items"
        When we login as user "foo" with password "bar"
        """
        {"user_type": "user", "email": "foo.bar@foobar.org"}
        """
        Given "blogs"
        """
        [{"title": "TEST_BLOG"}]
        """
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        Then we get response code 403

    @auth
    Scenario: Create and publish a post with Contributor permissions
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Contributor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "TEST_BLOG"}]
        """
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
            "guid": "tag:example.com,0000:newsml_BRE9A605"
        }
        """
        Then we get response code 403


    @auth
    Scenario: Create posts and save it as draft with Contributor permissions
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Contributor", "privileges": {"submit_post": 1, "posts": 1}}]
        """
        Given we have "Contributor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "TEST_BLOG"}]
        """
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
            "guid": "tag:example.com,0000:newsml_BRE9A605"
        }
        """
        And we get "/posts"
        Then we get list with 1 items

    @auth
    Scenario: Retrieve posts from blog
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog1"}]
        """
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
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog1"}]
        """
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
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog1", "cid": 1}]
        """
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
        Given empty "posts"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog1"}]
        """
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
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog3"}]
        """
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
        Given "blogs"
    	"""
        [{"title": "test_blog1"}]
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
        When we find for "users" the id as "user_admin" by "{"username": "admin"}"

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
        Given empty "posts"
        Given empty "items"
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog3"}]
        """
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
        {"firstcreated": "", "post_status": "open", "published_date": "", "blog": "#blogs._id#", "headline": "first post"}
        """

    @auth
    Scenario: Published date on posts that were drafts
        Given "roles"
        """
        [{"name": "Editor", "privileges": {"blogs": 1, "publish_post": 1, "users": 1, "posts": 1, "archive": 1}}]
        """
        Given we have "Editor" role
        Given we have "user" as type of user
        Given "blogs"
        """
        [{"title": "test_blog3"}]
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
        {"post_status": "open", "published_date": "", "blog": "#blogs._id#", "headline": "my draft will be published"}
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
        {"post_status": "draft", "published_date": "", "blog": "#blogs._id#", "headline": "my draft will be published", "unpublished_date":""}
        """
