Feature: Ads and collections operations

    @auth
    Scenario: List empty ads
        Given empty "ads"
        When we get "/ads"
        Then we get list with 0 items

    @auth
    Scenario: Add ads
        Given empty "ads"
        When we post to "ads"
        """
        [
            {
                "name": "Ads Test #01",
                "text": "<p>Hello there!</p>"
            }
        ]
        """
        And we get "ads"
        Then we get list with 1 items
        """
        {"_items": [{"name": "Ads Test #01", "text": "<p>Hello there!</p>"}]}
        """

    @auth
    Scenario: Update ads
        Given empty "ads"
        When we post to "ads"
        """
        [
            {
                "name": "Ads Test #02",
                "text": "<p>Hello there!</p>"
            }
        ]
        """
        When we patch latest
        """
        {"text": "<p>Hello here!</p>"}
        """
        Then we get OK response