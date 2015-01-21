Feature: Post operations

	@auth
    Scenario: Create posts
        Given empty "posts"
        Given empty "items"
         Given "blogs"
		"""
		[{"title": "TEST_BLOG"}]
		"""
        When we post to "items" with success
        """
        [{"headline": "test", "blog": "#blogs._id#"}]
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
                            "headline": "test package with text",
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
        And we get "/packages"
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
                                    "headline": "test package with text",
                                    "residRef": "#items._id#",
                                    "slugline": "awesome post"
                                }
                            ],
                            "role": "grpRole:Main"
                        }
                    ],
                    "guid": "tag:example.com,0000:newsml_BRE9A605"
                }
            ]
        }
        """

	@auth
    Scenario: Retrieve posts from blogs
        Given empty "posts"
        Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        When we post to "blogs"
	    """
	    [{"title": "testBlog", "language": "fr"}]
	    """
        When we post to "posts"
        """
        [{"headline": "test post for an open blog", "blog": "#blogs._id#"}]
        """
        And we get "/blogs/#blogs._id#/posts"
		Then we get list with 1 items

        
	@auth
    Scenario: Patch created package
		Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        Given empty "posts"
        When we post to "items"
        """
        [{"headline": "test", "blog": "#blogs._id#"}]
        """
        When we upload a file "bike.jpg" to "archive_media"
        When we post to "/posts" with success
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test package with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605"
        }
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
                            "headline": "test package with pic",
                            "residRef": "#archive_media._id#",
                            "slugline": "awesome picture"
                        },
                        {
                            "headline": "test package with text",
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
                            "headline": "test package with pic",
                            "residRef": "#archive_media._id#",
                            "slugline": "awesome picture"
                        },
                        {
                            "headline": "test package with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ],
            "guid": "tag:example.com,0000:newsml_BRE9A605",
            "type": "composite"
        }
        """

	@auth
    Scenario: Delete package
        Given empty "packages"
        When we post to "posts"
        """
        [{"headline": "test"}]
        """
        When we post to "/packages" with success
        """
        {
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {
                    "id": "main",
                    "refs": [
                        {
                            "headline": "test package with text",
                            "residRef": "#posts._id#",
                            "slugline": "awesome article"
                        }
                    ],
                    "role": "main"
                }
            ]
        }
        """
        When we delete "/posts/#posts._id#"
        Then we get response code 405
        
  