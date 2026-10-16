Feature: Collections operations

    @auth
    Scenario: List empty collections
        Given empty "collections"
        When we get "/collections"
        Then we get list with 0 items

    @auth
    Scenario: Add collections
        Given empty "collections"
        When we post to "collections"
        """
        [
            {
                "name": "Collection Test #01"
            }
        ]
        """
        And we get "collections"
        Then we get list with 1 items
        """
        {"_items": [{"name": "Collection Test #01"}]}
        """

    @auth
    Scenario: Update collections
        Given empty "advertisements"
        When we post to "advertisements"
        """
        [{"name": "Advertisements Test #01", "text": "<p>Hello there!</p>"}]
        """
        Given empty "collections"
        When we post to "collections"
        """
        [
            {
                "name": "Collection Test #02"
            }
        ]
        """
        When we patch latest
        """
        {"advertisements": [{"advertisement_id": "#advertisements._id#"}]}
        """
        Then we get OK response

    @auth
    Scenario: Delete collections
        Given empty "collections"
        When we post to "collections"
        """
        [
            {
                "name": "Collections Test #03"
            }
        ]
        """
        When we patch latest
        """
        {"deleted": true}
        """
        Then we get OK response

    @auth
    Scenario: Delete advertisement from collections
        When we post to "advertisements"
        """
        [{"name": "Advertisements Test #01", "text": "<p>Hello there!</p>"}]
        """
        Then we get OK response
        When we save "ad_id" from last response "_id"

        When we post to "collections"
        """
        [{"name": "Collection Test #04", "advertisements": [{"advertisement_id": "#ad_id#"}]}]
        """
        Then we get OK response

        When we patch "/advertisements/#ad_id#"
        """
        {"deleted": true}
        """
        Then we get OK response

        When we get "/collections"
        Then we get list with 1 items
        """
        {"_items": [{"name": "Collection Test #04", "advertisements": []}]}
        """

    @auth
    Scenario: Collections from different tenants are isolated
        Given a tenant "Tenant One"
        And a user "tenant1_admin" for current tenant
        Given a tenant "Tenant Two"
        And a user "tenant2_admin" for current tenant

        When we login as tenant user "tenant1_admin"
        When we post to "collections"
        """
        [{"name": "Tenant1 Collection"}]
        """
        Then we get OK response
        When we save "tenant1_collection_id" from last response "_id"

        When we login as tenant user "tenant2_admin"
        When we get "/collections"
        Then we get list with 0 items

        When we get "/collections/#tenant1_collection_id#"
        Then we get error 404

        When we attempt to patch "/collections/#tenant1_collection_id#"
        """
        {"name": "Hacked Collection"}
        """
        Then we get error 404
