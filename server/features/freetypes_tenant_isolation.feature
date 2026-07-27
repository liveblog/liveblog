Feature: Freetypes tenant isolation

    @auth
    Scenario: Freetypes are scoped to the current tenant
        Given system themes
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        # Tenant 1 creates a freetype
        When we login as tenant user "tenant1_admin"
        When we post to "freetypes"
        """
        [{"name": "Tenant1 Freetype", "template": "<p>Hello $name</p>"}]
        """
        Then we get OK response
        When we save "tenant1_freetype_id" from last response "_id"

        # Tenant 1 sees its own freetype
        When we get "/freetypes"
        Then we get list with 1 items

        # Tenant 2 cannot see Tenant 1's freetypes
        When we login as tenant user "tenant2_admin"
        When we get "/freetypes"
        Then we get list with 0 items

        # Tenant 2 cannot access Tenant 1's freetype by ID
        When we get "/freetypes/#tenant1_freetype_id#"
        Then we get error 404

    @auth
    Scenario: Tenant can create and list its own freetypes
        Given system themes
        Given a tenant "Test Tenant"
        And a user "test_admin" for current tenant
        When we login as tenant user "test_admin"

        When we post to "freetypes"
        """
        [{"name": "My Freetype", "template": "<p>$content</p>"}]
        """
        Then we get OK response

        When we get "/freetypes"
        Then we get list with 1 items
        """
        {"_items": [{"name": "My Freetype"}]}
        """
