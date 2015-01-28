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
                            "headline": "test package with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome post"
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
                                    "slugline": "awesome post",
                                     "item": {
										"text": "test",
										"particular_type": "item",
										"type": "text"
									}
                                }
                            ],
                            "role": "grpRole:Main"
                        }
                    ],
                    "blog": "#blogs._id#"
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
	     When we post to "posts"
        """
        [{"headline": "test post 2", "blog": "#blogs._id#"}]
        """
		And we get "/blogs/#blogs._id#/posts"
		Then we get list with 2 items

        
	@auth
    Scenario: Patch created package
		Given empty "posts"
		Given empty "items"
		Given "blogs"
		"""
		[{"title": "test_blog1"}]
		"""
        When we post to "items"
        """
        [{"text": "test", "blog": "#blogs._id#"}]
        """
        When we upload a file "bike.jpg" to "archive_media"
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
                            "headline": "test package with pic",
                            "residRef": "#archive_media._id#",
                            "slugline": "awesome picture",
                            "item": {
                            	"headline" : "bike.jpg",
                            	"particular_type": "item",
								"type": "picture"
                            }
                        },
                        {
                            "headline": "test package with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article",
                            "item": {
                            	"text" : "test",
                            	"particular_type": "item",
								"type": "text"
                            }
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
                            "slugline": "awesome picture",
                            "item": {
                            	"headline" : "bike.jpg",
                            	"particular_type": "item",
								"type": "picture"
                            }
                        },
                        {
                            "headline": "test package with text",
                            "residRef": "#items._id#",
                            "slugline": "awesome article",
                            "item": {
                            	"text" : "test",
                            	"particular_type": "item",
								"type": "text"
                            }
                        }
                    ],
                    "role": "main"
                }
            ],
            "type": "composite",
            "blog": "#blogs._id#"
        }
        """
