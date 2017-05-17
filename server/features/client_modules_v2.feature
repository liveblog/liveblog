Feature: Blog v2 operations

    @auth
    Scenario: Get blog posts
    	Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
        """
        [
          {
            "title": "Test blog",
            "blog_status": "open",
            "blog_preferences": {
              "theme": "default",
              "language": "en"
            },
            "members": [{"user": "#CONTEXT_USER_ID#"}]
          }
        ]
        """
        Given "archive" as item list
        """
        [
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #01",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #02",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #03",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #04",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #05",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #06",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #07",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #08",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #09",
            "blog": "#blogs._id#"
          },
          {
            "original_creator": "#CONTEXT_USER_ID#",
            "item_type": "text",
            "particular_type": "item",
            "text": "Item #10",
            "blog": "#blogs._id#"
          }
        ]
        """
        When we post to "posts" with success
        """
        [
          {
            "headline": "Post #01",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[0]._id#",
                  "residRef": "#archive[0]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #02",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[1]._id#",
                  "residRef": "#archive[1]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #03",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[2]._id#",
                  "residRef": "#archive[2]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #04",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[3]._id#",
                  "residRef": "#archive[3]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #05",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[4]._id#",
                  "residRef": "#archive[4]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #06",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[5]._id#",
                  "residRef": "#archive[5]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #07",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[6]._id#",
                  "residRef": "#archive[6]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #08",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[7]._id#",
                  "residRef": "#archive[7]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #09",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[8]._id#",
                  "residRef": "#archive[8]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          },
          {
            "headline": "Post #10",
            "blog": "#blogs._id#",
            "post_status": "open",
            "groups": [
              {
                "id": "root",
                "refs": [{"idRef": "main"}],
                "role": "grpRole:NEP"
              },
              {
                "id": "main",
                "refs": [{
                  "guid": "#archive[9]._id#",
                  "residRef": "#archive[9]._id#",
                  "type": "text"
                }],
                "role": "main"
              }
            ]
          }
        ]
        """
        And we get "/v2/client_blogs/#blogs._id#/posts"
        Then we get list with 10 items
