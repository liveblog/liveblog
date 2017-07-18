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
        Given "advertisements"
        """
        [{"name": "Advertisements Test #01", "text": "<p>Hello there!</p>"}]
        """
        Given "collections"
        """
        [
            {
                "name": "Collection Test #04",
                "advertisements": [{"advertisement_id": "#advertisements._id#"}]
            }
        ]
        """
        When we patch "/advertisements/#advertisements._id#"
        """
        {"deleted": true}
        """
        When we get "/collections"
        Then we get list with 1 items
        """
        {"_items": [{"name": "Collection Test #04", "advertisements": []}]}
        """
