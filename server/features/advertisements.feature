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
