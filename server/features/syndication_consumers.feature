Feature: Consumer Resource

    @auth
    Scenario: Create a consumer
        Given empty "consumers"
        When we post to "consumers"
        """
        [{"name": "Consumer 1", "contacts": [{"first_name": "Foo", "last_name": "Bar", "email": "foo@bar.tld", "phone": "+49123456789"}]}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {"name": "Consumer 1", "contacts": [{"first_name": "Foo", "last_name": "Bar", "email": "foo@bar.tld", "phone": "+49123456789"}], "api_key": "#consumers.api_key#"}
        """

    @auth
    Scenario: List consumers
        Given "consumers"
        """
        [
            {"name": "Consumer 1", "contacts": [{"first_name": "Foo", "last_name": "Bar", "email": "foo@bar.tld", "phone": "+49123456789"}]},
            {"name": "Consumer 2", "contacts": [{"first_name": "Boo", "last_name": "Baz", "email": "boo@baz.tld", "phone": "+49987654321"}]}
        ]
        """
        When we get "/consumers"
        Then we get list with 2 items
        And we get consumers
        """
        ["Consumer 1", "Consumer 2"]
        """

    @auth
    Scenario: Update consumer
        Given "consumers"
        """
        [{"name": "Consumer 1", "contacts": [{"first_name": "Foo", "last_name": "Bar", "email": "foo@bar.tld", "phone": "+49123456789"}]}]
        """
        When we find for "consumers" the id as "consumer_id" by "where={"name": "Consumer 1"}"
        And we patch "/consumers/#consumer_id#"
        """
        {"name":"Test Consumer"}
        """
        Then we get updated response

    @auth
    Scenario: Delete consumer
        Given "consumers"
        """
        [{"name": "Consumer 1", "contacts": [{"first_name": "Foo", "last_name": "Bar", "email": "foo@bar.tld", "phone": "+49123456789"}]}]
        """
        When we find for "consumers" the id as "consumer_id" by "where={"name": "Consumer 1"}"
        And we delete "/consumers/#consumer_id#"
        Then we get deleted response
