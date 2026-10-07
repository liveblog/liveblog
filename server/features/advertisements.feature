Feature: Advertisements and collections operations

    @auth
    Scenario: List empty advertisements
        Given empty "advertisements"
        When we get "/advertisements"
        Then we get list with 0 items

    @auth
    Scenario: Add advertisements
        Given empty "advertisements"
        When we post to "advertisements"
        """
        [
            {
                "name": "Advertisements Test #01",
                "text": "<p>Hello there!</p>"
            }
        ]
        """
        And we get "advertisements"
        Then we get list with 1 items
        """
        {"_items": [{"name": "Advertisements Test #01", "text": "<p>Hello there!</p>"}]}
        """

    @auth
    Scenario: Update advertisements
        Given empty "advertisements"
        When we post to "advertisements"
        """
        [
            {
                "name": "Advertisements Test #02",
                "text": "<p>Hello there!</p>"
            }
        ]
        """
        When we patch latest
        """
        {"text": "<p>Hello here!</p>"}
        """
        Then we get OK response

    @auth
    Scenario: Delete advertisements
        Given empty "advertisements"
        When we post to "advertisements"
        """
        [
            {
                "name": "Advertisements Test #03",
                "text": "<p>Hello there!</p>"
            }
        ]
        """
        When we patch latest
        """
        {"deleted": true}
        """
        Then we get OK response

    @auth
    Scenario: Advertisements from different tenants are isolated
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "advertisements"
        """
        [{"name": "Tenant1 Ad", "text": "<p>Buy our stuff</p>"}]
        """
        Then we get OK response
        When we save "tenant1_ad_id" from last response "_id"
        When we save "IF_MATCH_VALUE" from last response "_etag"

        When we login as tenant user "tenant2_admin"
        When we get "/advertisements"
        Then we get list with 0 items

        When we get "/advertisements/#tenant1_ad_id#"
        Then we get error 404

        When we attempt to patch "/advertisements/#tenant1_ad_id#"
        """
        {"text": "<p>Hacked</p>"}
        """
        Then we get error 404
