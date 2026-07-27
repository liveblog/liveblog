Feature: Theme Settings (Tenant Customizations)

    @auth
    Scenario: Tenant customizes system theme settings via PATCH
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given system themes
        When we find for "themes" the id as "classic-id" by "where={"name": "classic"}"
        When we get "/themes/#classic-id#"
        Then we get OK response

        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#classic-id#"
        """
        {"settings": {"testSetting": "customValue"}}
        """
        Then we get OK response

        When we get "/themes/#classic-id#"
        Then we get OK response
        """
        {"name": "classic", "settings": {"testSetting": "customValue"}}
        """

    @auth
    Scenario: GET theme returns effective settings (defaults plus customizations)
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given system themes
        When we post to "themes"
        """
        [{"name": "test-theme", "extends": "classic", "options": [{"name": "postsPerPage", "default": "10"}, {"name": "color", "default": "blue"}, {"name": "font", "default": "Arial"}]}]
        """
        Then we get OK response

        When we find for "themes" the id as "test-theme-id" by "where={"name": "test-theme"}"
        When we get "/themes/#test-theme-id#"
        Then we get OK response
        """
        {"name": "test-theme", "settings": {"postsPerPage": "10", "color": "blue", "font": "Arial"}}
        """

        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#test-theme-id#"
        """
        {"settings": {"postsPerPage": "20"}}
        """
        Then we get OK response

        When we get "/themes/#test-theme-id#"
        Then we get OK response
        """
        {"name": "test-theme", "settings": {"postsPerPage": "20", "color": "blue", "font": "Arial"}}
        """

    @auth
    Scenario: Tenant A customizations do not affect Tenant B
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        Given a tenant "Tenant B"
        And a user "user_b" for current tenant

        Given system themes

        When we login as tenant user "user_a"
        When we find for "themes" the id as "classic-id" by "where={"name": "classic"}"
        When we get "/themes/#classic-id#"
        Then we get OK response

        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#classic-id#"
        """
        {"settings": {"tenantASetting": "valueA"}}
        """
        Then we get OK response

        When we get "/themes/#classic-id#"
        Then we get OK response
        """
        {"name": "classic", "settings": {"tenantASetting": "valueA"}}
        """

        When we login as tenant user "user_b"
        When we find for "themes" the id as "classic-id-b" by "where={"name": "classic"}"
        When we get "/themes/#classic-id-b#"
        Then we get OK response
        """
        {"name": "classic"}
        """

    @auth
    Scenario: Nested styleSettings merge correctly
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given system themes
        When we post to "themes"
        """
        [{"name": "style-theme", "extends": "classic", "supportStylesSettings": true, "styleOptions": [{"name": "colors", "options": [{"property": "primary", "default": "#000000"}, {"property": "secondary", "default": "#ffffff"}]}, {"name": "fonts", "options": [{"property": "heading", "default": "Arial"}]}]}]
        """
        Then we get OK response

        When we find for "themes" the id as "style-theme-id" by "where={"name": "style-theme"}"
        When we get "/themes/#style-theme-id#"
        Then we get OK response

        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#style-theme-id#"
        """
        {"styleSettings": {"colors": {"primary": "#ff0000"}}}
        """
        Then we get OK response

        When we get "/themes/#style-theme-id#"
        Then we get OK response
        """
        {"name": "style-theme", "styleSettings": {"colors": {"primary": "#ff0000", "secondary": "#ffffff"}, "fonts": {"heading": "Arial"}}}
        """

    @auth
    Scenario: Customizing read-only system theme creates theme_settings entry
        Given a tenant "Tenant A"
        And a user "user_a" for current tenant
        When we login as tenant user "user_a"

        Given system themes
        When we find for "themes" the id as "classic-id" by "where={"name": "classic"}"
        When we get "/themes/#classic-id#"
        Then we get OK response

        When we save "IF_MATCH_VALUE" from last response "_etag"
        When we attempt to patch "/themes/#classic-id#"
        """
        {"settings": {"customSetting": "tenantValue"}}
        """
        Then we get OK response

        When we get "/themes/#classic-id#"
        Then we get OK response
        """
        {"name": "classic", "settings": {"customSetting": "tenantValue"}}
        """
