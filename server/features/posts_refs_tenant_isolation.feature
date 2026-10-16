Feature: Post refs only resolve items and polls of the post's tenant

    Background:
        Given system themes
        Given a tenant "Tenant Alpha"
        And a user "alpha_admin" for current tenant
        Given we save the current tenant id as "TENANT_A"
        Given we save the id of user "alpha_admin" as "A_USER"
        Given a tenant "Tenant Beta"
        And a user "beta_admin" for current tenant

    @auth
    Scenario: Post refs to other resources or other tenants are rejected
        When we login as tenant user "alpha_admin"
        When we post to "blogs"
        """
        [{"title": "A blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "a_blog" from last response "_id"
        When we post to "items"
        """
        [{"text": "alpha private text", "blog": "#a_blog#", "item_type": "text"}]
        """
        When we save "a_item" from last response "_id"
        When we post to "polls"
        """
        [{"blog": "#a_blog#", "poll_body": {"question": "alpha private poll", "answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}]
        """
        When we save "a_poll" from last response "_id"

        When we login as tenant user "beta_admin"
        When we post to "blogs"
        """
        [{"title": "B blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "b_blog" from last response "_id"
        When we post to "items"
        """
        [{"text": "beta text", "blog": "#b_blog#", "item_type": "text"}]
        """
        When we save "b_item" from last response "_id"
        When we post to "polls"
        """
        [{"blog": "#b_blog#", "poll_body": {"question": "beta poll", "answers": [{"option": "Yes", "votes": 0}, {"option": "No", "votes": 0}]}}]
        """
        When we save "b_poll" from last response "_id"

        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#TENANT_A#", "location": "tenants"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400
        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#b_item#"}, {"residRef": "#A_USER#", "location": "users"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400
        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#a_item#"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400
        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#a_item#", "location": "items"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400
        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#a_poll#", "location": "polls", "type": "poll"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400

        # the same refs the editor sends: plain item refs and `polls` refs
        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [
                {"residRef": "#b_item#"},
                {"residRef": "#b_poll#", "location": "polls", "type": "poll"}
            ], "role": "grpRole:Main"}
        ]}
        """
        Then we get new resource
        """
        {"post_status": "open"}
        """
        When we save "b_post" from last response "_id"
        When we get "/posts/#b_post#"
        Then we get existing resource
        """
        {"groups": [{"id": "root"}, {"id": "main", "refs": [
            {"residRef": "#b_item#", "item": {"text": "beta text"}},
            {"residRef": "#b_poll#", "item": {"poll_body": {"question": "beta poll"}}}
        ]}]}
        """
        When we get anonymously "/client_blogs/#b_blog#/posts"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "#b_post#", "groups": [{"id": "root"}, {"id": "main", "refs": [
            {"residRef": "#b_item#", "item": {"text": "beta text"}},
            {"residRef": "#b_poll#", "item": {"poll_body": {"question": "beta poll"}}}
        ]}]}]}
        """

        # updates go through the same check
        When we get "/posts/#b_post#"
        When we patch "/posts/#b_post#"
        """
        {"groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#TENANT_A#", "location": "tenants"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400
        When we patch "/posts/#b_post#"
        """
        {"groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#a_item#"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get error 400

    @auth
    Scenario: Stored post refs to other resources or other tenants do not resolve
        When we login as tenant user "alpha_admin"
        When we post to "blogs"
        """
        [{"title": "A blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "a_blog" from last response "_id"
        When we post to "items"
        """
        [{"text": "alpha private text", "blog": "#a_blog#", "item_type": "text"}]
        """
        When we save "a_item" from last response "_id"

        When we login as tenant user "beta_admin"
        When we post to "blogs"
        """
        [{"title": "B blog", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "b_blog" from last response "_id"
        When we post to "items"
        """
        [{"text": "beta text", "blog": "#b_blog#", "item_type": "text"}]
        """
        When we save "b_item" from last response "_id"
        When we post to "/posts"
        """
        {"blog": "#b_blog#", "post_status": "open", "groups": [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [{"residRef": "#b_item#"}], "role": "grpRole:Main"}
        ]}
        """
        Then we get new resource
        """
        {"post_status": "open"}
        """
        When we save "b_post" from last response "_id"
        Given archive document "#b_post#" has the raw groups
        """
        [
            {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
            {"id": "main", "refs": [
                {"residRef": "#b_item#"},
                {"residRef": "#TENANT_A#", "location": "tenants"},
                {"residRef": "#A_USER#", "location": "users"},
                {"residRef": "#a_item#"},
                {"residRef": "#a_item#", "location": "archive"}
            ], "role": "grpRole:Main"}
        ]
        """

        When we get "/posts/#b_post#"
        Then we get existing resource
        """
        {"groups": [{"id": "root"}, {"id": "main", "refs": [{"residRef": "#b_item#", "item": {"text": "beta text"}}]}]}
        """
        Then the response does not contain "Tenant Alpha"
        Then the response does not contain "alpha_admin"
        Then the response does not contain "alpha private text"

        When we get "/blogs/#b_blog#/posts"
        Then we get list with 1 items
        Then the response does not contain "Tenant Alpha"
        Then the response does not contain "alpha_admin"
        Then the response does not contain "alpha private text"

        When we get anonymously "/client_blogs/#b_blog#/posts"
        Then we get list with 1 items
        """
        {"_items": [{"_id": "#b_post#", "groups": [{"id": "root"}, {"id": "main", "refs": [{"residRef": "#b_item#", "item": {"text": "beta text"}}]}]}]}
        """
        Then the response does not contain "Tenant Alpha"
        Then the response does not contain "alpha_admin"
        Then the response does not contain "alpha private text"

        When we get anonymously "/client_posts/#b_post#"
        Then we get existing resource
        """
        {"_id": "#b_post#"}
        """
        Then the response does not contain "Tenant Alpha"
        Then the response does not contain "alpha_admin"
        Then the response does not contain "alpha private text"
