Feature: Freetypes operations

    @auth
    Scenario: List empty freetypes
        Given empty "freetypes"
        When we get "/freetypes"
        Then we get list with 0 items

    @auth
    Scenario: Add freetype
        Given empty "freetypes"
        When we post to "freetypes"
        """
        [
            {
                "name": "Freetype Test #01",
                "template": "<p>Hello $name!</p>"
            }
        ]
        """
        And we get "freetypes"
        Then we get list with 1 items
        """
        {"_items": [{"name": "Freetype Test #01", "template": "<p>Hello $name!</p>"}]}
        """

    @auth
    Scenario: Update freetype
        Given empty "freetypes"
        When we post to "freetypes"
        """
        [
            {
                "name": "Freetype Test #02",
                "template": "<p>Hello $name! Valid HTML</p>"
            }
        ]
        """
        When we patch latest
        """
        {"template": "<div><p>Still valid HTML, $name!</p></div>"}
        """
        And we patch latest without assert
        """
        {"template": "<div><p>Not valid, $dude!</p>"}
        """
        Then we get response code 400

    @auth
    Scenario: Update freetype empty vars templates
        Given empty "freetypes"
        When we post to "freetypes"
        """
        [
            {
                "name": "Freetype Test #02",
                "template": "<p>Hello $name! Valid HTML</p>"
            }
        ]
        """
        When we patch latest without assert
        """
        {"template": "<p>Not valid, dude!</p>"}
        """
        Then we get response code 400
