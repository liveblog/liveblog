Feature: Themes operations

    @auth
    Scenario: List empty themes
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"
        Given empty "themes"
        When we get "/themes"
        Then we get list with 0 items


    @auth
    Scenario: Add user-uploaded theme (tenant-specific)
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "forest"}]
        """
        Then we get existing resource
        """
        {"name": "forest"}
        """


    @auth
    Scenario: Upload a theme with satisfied dependencies
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"
        Given system themes
        # TODO: Fix authentication for /theme-upload endpoint
        # When we upload a file "dog-theme.zip" to "theme-upload"
        When we get "/themes"
        Then we get list with 5 items

    @auth
    Scenario: Tenant user can delete own theme
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        # preferences is needed in themes.on_delete method
        Given "global_preferences"
        """
        [{"key": "theme", "value": "classic"}]
        """
        When we get "/global_preferences"
        Then we get list with 1 items
        """
        {"_items": [{"key": "theme", "value": "classic"}]}
        """

        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "forest-theme", "version": "1.0.1"}, {"name": "ocean-theme", "version": "2.0.1"}]
        """
        Then we get OK response
        When we get "/themes"
        Then we get list with 2 items
        When we find for "themes" the id as "my-forest-theme" by "where={"name": "forest-theme"}"
        When we delete "/themes/#my-forest-theme#"
        Then we get OK response

    @auth
    Scenario: Overwrite default theme_settings
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"
        Given system themes
        When we post to "themes"
        """
        [{"name": "custom-classic", "extends": "angular", "options": [{"name": "postsPerPage", "default": "22"}, {"name": "postOrder", "default": "editorial"}]}]
        """
        Then we get OK response
        When we find for "themes" the id as "my-classic" by "where={"name": "custom-classic"}"
        When we get "/themes/#my-classic#"
        Then we get OK response
        """
        {"name": "custom-classic"}
        """
        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#my-classic#"
        """
        {"options": [{"name": "postsPerPage", "default": "30"}]}
        """
        Then we get OK response
        When we get "/themes/#my-classic#"
        Then we get existing resource
        """
        {"name": "custom-classic", "options": [{"name": "postsPerPage", "default": "30"}]}
        """

    @auth
    Scenario: Tenants cannot see each other's uploaded themes
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "tenant-a-theme"}]
        """
        Then we get OK response
        When we save "theme_a_id" from last response "_id"

        When we login as tenant user "user_b"
        When we post to "themes"
        """
        [{"name": "tenant-b-theme"}]
        """
        Then we get OK response

        When we get "/themes"
        Then we get list with 1 items
        """
        {"_items": [{"name": "tenant-b-theme"}]}
        """

        When we login as tenant user "user_a"
        When we get "/themes"
        Then we get list with 1 items
        """
        {"_items": [{"name": "tenant-a-theme"}]}
        """

    @auth
    Scenario: Tenant cannot access another tenant's theme by ID
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "tenant-a-private"}]
        """
        Then we get OK response
        When we save "theme_a_id" from last response "_id"

        When we login as tenant user "user_b"
        When we get "/themes/#theme_a_id#"
        Then we get error 404

    @auth
    Scenario: Tenant cannot delete another tenant's theme
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "tenant-a-deletable"}]
        """
        Then we get OK response
        When we save "theme_a_id" from last response "_id"

        When we login as tenant user "user_b"
        When we attempt to delete "/themes/#theme_a_id#"
        Then we get error 404

    @auth
    Scenario: Tenant cannot update another tenant's theme
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "tenant-a-editable", "label": "Original Label"}]
        """
        Then we get OK response
        When we save "theme_a_id" from last response "_id"

        When we login as tenant user "user_b"
        When we attempt to patch "/themes/#theme_a_id#"
        """
        {"label": "Hacked Label"}
        """
        Then we get error 404

    @auth
    Scenario: Both tenants can see system themes
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        Given system themes

        When we login as tenant user "user_a"
        When we get "/themes"
        Then we get list with 5 items

        When we login as tenant user "user_b"
        When we get "/themes"
        Then we get list with 5 items

    @auth
    Scenario: Two tenants can upload themes with the same name
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "company-theme", "label": "Tenant A Theme"}]
        """
        Then we get OK response

        When we login as tenant user "user_b"
        When we post to "themes"
        """
        [{"name": "company-theme", "label": "Tenant B Theme"}]
        """
        Then we get OK response

        When we get "/themes"
        Then we get list with 1 items
        """
        {"_items": [{"name": "company-theme", "label": "Tenant B Theme"}]}
        """

        When we login as tenant user "user_a"
        When we get "/themes"
        Then we get list with 1 items
        """
        {"_items": [{"name": "company-theme", "label": "Tenant A Theme"}]}
        """

    @auth
    Scenario: System themes cannot be deleted
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"
        Given system themes
        When we find for "themes" the id as "system-theme-id" by "where={"name": "angular"}"
        When we delete "/themes/#system-theme-id#"
        Then we get error 403

    @auth
    Scenario: Tenant cannot delete theme with child themes
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given "global_preferences"
        """
        [{"key": "theme", "value": "classic"}]
        """

        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "parent-theme", "version": "1.0.1"}, {"name": "child-theme", "version": "1.0.1", "extends": "parent-theme"}]
        """
        Then we get OK response

        When we find for "themes" the id as "parent-theme-id" by "where={"name": "parent-theme"}"
        When we delete "/themes/#parent-theme-id#"
        Then we get error 403

    @auth
    Scenario: Theme quota includes system themes and tenant themes
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given system themes
        When we get "/themes"
        Then we get list with 5 items

        Given the theme quota is 7
        When we post to "themes"
        """
        [{"name": "custom-1"}, {"name": "custom-2"}]
        """
        Then we get OK response
        When we get "/themes"
        Then we get list with 7 items

    @auth
    Scenario: Cannot exceed theme quota
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given system themes
        Given the theme quota is 7
        When we post to "themes"
        """
        [{"name": "custom-1"}, {"name": "custom-2"}]
        """
        Then we get OK response

        When we post to "themes"
        """
        [{"name": "custom-3"}]
        """
        Then we get error 403

    @auth
    Scenario: PATCH settings response reflects effective settings not theme defaults
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "custom-theme", "options": [{"name": "postsPerPage", "default": "10"}, {"name": "postOrder", "default": "editorial"}]}]
        """
        Then we get OK response
        When we find for "themes" the id as "theme_id" by "where={"name": "custom-theme"}"
        When we get "/themes/#theme_id#"
        Then we get OK response
        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#theme_id#"
        """
        {"settings": {"postsPerPage": "25", "postOrder": "editorial"}}
        """
        Then we get existing resource
        """
        {"settings": {"postsPerPage": "25", "postOrder": "editorial"}}
        """
        When we get "/themes/#theme_id#"
        Then we get existing resource
        """
        {"settings": {"postsPerPage": "25", "postOrder": "editorial"}}
        """

    @auth
    Scenario: Theme settings are isolated between tenants
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        When we login as tenant user "user_a"
        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "shared-theme", "options": [{"name": "postsPerPage", "default": "10"}]}]
        """
        Then we get OK response
        When we find for "themes" the id as "theme_a_id" by "where={"name": "shared-theme"}"
        When we get "/themes/#theme_a_id#"
        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#theme_a_id#"
        """
        {"settings": {"postsPerPage": "25"}}
        """
        Then we get OK response

        When we login as tenant user "user_b"
        When we post to "themes"
        """
        [{"name": "shared-theme", "options": [{"name": "postsPerPage", "default": "10"}]}]
        """
        Then we get OK response
        When we find for "themes" the id as "theme_b_id" by "where={"name": "shared-theme"}"
        When we get "/themes/#theme_b_id#"
        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#theme_b_id#"
        """
        {"settings": {"postsPerPage": "50"}}
        """
        Then we get OK response

        When we login as tenant user "user_a"
        When we get "/themes/#theme_a_id#"
        Then we get existing resource
        """
        {"settings": {"postsPerPage": "25"}}
        """

        When we login as tenant user "user_b"
        When we get "/themes/#theme_b_id#"
        Then we get existing resource
        """
        {"settings": {"postsPerPage": "50"}}
        """

    @auth
    Scenario: Tenant cannot create duplicate themes with same name
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given empty "themes"
        When we post to "themes"
        """
        [{"name": "unique-theme", "label": "First Theme"}]
        """
        Then we get OK response

        When we post to "themes"
        """
        [{"name": "unique-theme", "label": "Duplicate Theme"}]
        """
        Then we get error 409
