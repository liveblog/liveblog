Feature: Public comments land in the blog's tenant

    @auth
    Scenario: Anonymous comment lands in the blog's tenant and ignores non-public fields
        Given system themes
        Given a tenant "Tenant A"
        And a user "a_admin" for current tenant
        Given we save the current tenant id as "TENANT_A"
        Given a tenant "Tenant B"
        And a user "b_admin" for current tenant
        Given we save the current tenant id as "TENANT_B"
        When we login as tenant user "b_admin"
        When we post to "blogs"
        """
        [{"title": "B blog", "users_can_comment": "enabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "b_blog" from last response "_id"

        When we post anonymously to "/client_items"
        """
        {"text": "hello", "commenter": "reader", "client_blog": "#b_blog#", "item_type": "image", "tenant_id": "#TENANT_A#"}
        """
        Then we get new resource
        """
        {"text": "hello", "commenter": "reader", "item_type": "comment"}
        """
        Then archive document "#client_items._id#" belongs to tenant "#TENANT_B#"

        When we post anonymously to "/client_comments"
        """
        {
            "post_status": "open",
            "client_blog": "#b_blog#",
            "tenant_id": "#TENANT_A#",
            "sticky": true,
            "lb_highlight": true,
            "published_date": "2020-01-01T00:00:00+0000",
            "publisher": {"display_name": "Editor in chief"},
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {"id": "main", "refs": [{"residRef": "#client_items._id#"}], "role": "grpRole:Main"}
            ]
        }
        """
        Then we get new resource
        """
        {"post_status": "comment", "sticky": false, "lb_highlight": false}
        """
        Then archive document "#client_comments._id#" belongs to tenant "#TENANT_B#"
        Then archive document "#client_comments._id#" has no field "published_date"
        Then archive document "#client_comments._id#" has no field "publisher"

        # The editor of tenant B sees the comment, tenant A does not
        When we get "/posts/#client_comments._id#"
        Then we get existing resource
        """
        {"post_status": "comment", "blog": "#b_blog#"}
        """
        When we login as tenant user "a_admin"
        When we get "/posts/#client_comments._id#"
        Then we get error 404

    @auth
    Scenario: Comments are rejected when the blog does not accept them
        Given system themes
        Given a tenant "Tenant B"
        And a user "b_admin" for current tenant
        When we login as tenant user "b_admin"
        When we post to "blogs"
        """
        [{"title": "disabled", "users_can_comment": "disabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "disabled_blog" from last response "_id"
        When we post to "blogs"
        """
        [{"title": "theme default", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "unset_blog" from last response "_id"
        When we post to "blogs"
        """
        [{"title": "closed", "users_can_comment": "enabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "closed_blog" from last response "_id"
        When we patch "/blogs/#closed_blog#"
        """
        {"blog_status": "closed"}
        """
        Then we get OK response

        When we post anonymously to "/client_items"
        """
        {"text": "hi", "commenter": "reader", "client_blog": "#disabled_blog#", "item_type": "comment"}
        """
        Then we get error 403
        """
        {"_message": "Comments are disabled for this blog"}
        """
        # the classic theme ships with canComment off
        When we post anonymously to "/client_items"
        """
        {"text": "hi", "commenter": "reader", "client_blog": "#unset_blog#", "item_type": "comment"}
        """
        Then we get error 403
        When we post anonymously to "/client_items"
        """
        {"text": "hi", "commenter": "reader", "client_blog": "#closed_blog#", "item_type": "comment"}
        """
        Then we get error 403
        When we post anonymously to "/client_comments"
        """
        {"client_blog": "#closed_blog#", "groups": [{"id": "root", "refs": [{"idRef": "main"}]}, {"id": "main", "refs": [{"residRef": "x"}]}]}
        """
        Then we get error 403

    @auth
    Scenario: Comments are accepted when an output channel theme allows them
        Given system themes
        Given a tenant "Tenant B"
        And a user "b_admin" for current tenant
        When we login as tenant user "b_admin"
        When we post to "themes"
        """
        [{"name": "commenting-theme", "extends": "classic", "options": [{"name": "canComment", "type": "checkbox", "default": true}]}]
        """
        Then we get OK response
        When we post to "blogs"
        """
        [{"title": "theme default", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "mixed_blog" from last response "_id"
        # the classic theme ships with canComment off
        When we post anonymously to "/client_items"
        """
        {"text": "hi", "commenter": "reader", "client_blog": "#mixed_blog#", "item_type": "comment"}
        """
        Then we get error 403
        When we post to "outputs"
        """
        [{"name": "commenting output", "blog": "#mixed_blog#", "theme": "commenting-theme"}]
        """
        Then we get OK response
        When we post anonymously to "/client_items"
        """
        {"text": "hi", "commenter": "reader", "client_blog": "#mixed_blog#", "item_type": "comment"}
        """
        Then we get new resource
        """
        {"item_type": "comment", "blog": "#mixed_blog#"}
        """

    @auth
    Scenario: Bulk comments must target a single blog
        Given system themes
        Given a tenant "Tenant A"
        And a user "a_admin" for current tenant
        Given a tenant "Tenant B"
        And a user "b_admin" for current tenant
        When we login as tenant user "a_admin"
        When we post to "blogs"
        """
        [{"title": "A blog", "users_can_comment": "enabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "a_blog" from last response "_id"
        When we login as tenant user "b_admin"
        When we post to "blogs"
        """
        [{"title": "B blog", "users_can_comment": "enabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "b_blog" from last response "_id"
        When we post anonymously to "/client_items"
        """
        [
            {"text": "first", "commenter": "reader", "client_blog": "#b_blog#", "item_type": "comment"},
            {"text": "second", "commenter": "reader", "client_blog": "#a_blog#", "item_type": "comment"}
        ]
        """
        Then we get error 400
        """
        {"_message": "Comments must target exactly one blog"}
        """

    @auth
    Scenario: Comment refs cannot point at other resources or other blogs
        Given system themes
        Given a tenant "Tenant A"
        And a user "a_admin" for current tenant
        Given we save the current tenant id as "TENANT_A"
        Given we save the id of user "a_admin" as "A_USER"
        When we login as tenant user "a_admin"
        When we post to "blogs"
        """
        [{"title": "A blog", "users_can_comment": "enabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "a_blog" from last response "_id"
        When we post anonymously to "/client_items"
        """
        {"text": "comment on A", "commenter": "reader", "client_blog": "#a_blog#", "item_type": "comment"}
        """
        Then we get new resource
        """
        {"item_type": "comment"}
        """
        When we save "a_comment_item" from last response "_id"

        Given a tenant "Tenant B"
        And a user "b_admin" for current tenant
        When we login as tenant user "b_admin"
        When we post to "blogs"
        """
        [{"title": "B blog", "users_can_comment": "enabled", "blog_preferences": {"theme": "classic", "language": "en"}}]
        """
        When we save "b_blog" from last response "_id"
        When we post to "items"
        """
        [{"text": "editor draft item", "blog": "#b_blog#", "item_type": "text"}]
        """
        When we save "b_editor_item" from last response "_id"

        # another resource through `location`
        When we post anonymously to "/client_comments"
        """
        {
            "client_blog": "#b_blog#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {"id": "main", "refs": [{"residRef": "#TENANT_A#", "location": "tenants"}], "role": "grpRole:Main"}
            ]
        }
        """
        Then we get error 400
        When we post anonymously to "/client_comments"
        """
        {
            "client_blog": "#b_blog#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {"id": "main", "refs": [{"residRef": "#A_USER#", "location": "users"}], "role": "grpRole:Main"}
            ]
        }
        """
        Then we get error 400

        # a comment item from another tenant's blog
        When we post anonymously to "/client_comments"
        """
        {
            "client_blog": "#b_blog#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {"id": "main", "refs": [{"residRef": "#a_comment_item#"}], "role": "grpRole:Main"}
            ]
        }
        """
        Then we get error 400

        # an editor item of the same blog that is not a comment
        When we post anonymously to "/client_comments"
        """
        {
            "client_blog": "#b_blog#",
            "groups": [
                {"id": "root", "refs": [{"idRef": "main"}], "role": "grpRole:NEP"},
                {"id": "main", "refs": [{"residRef": "#b_editor_item#"}], "role": "grpRole:Main"}
            ]
        }
        """
        Then we get error 400

        When we get anonymously "/client_blogs/#b_blog#/posts?source={"query": {"filtered": {"filter": {"term": {"post_status": "comment"}}}}}"
        Then we get list with 0 items
