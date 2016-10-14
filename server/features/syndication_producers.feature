Feature: Producer Resource

    @auth
    Scenario: Create a producer
        Given empty "producers"
        When we post to "producers"
        """
        [{"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        Then we get OK response
        Then we get existing resource
        """
        {"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}
        """

    @auth
    Scenario: List producers
        Given "producers"
        """
        [
            {"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"},
            {"name": "Producer 2", "api_url": "http://192.168.1.123:5000/api/", "consumer_api_key": "__any_value__"}
        ]
        """
        When we get "/producers"
        Then we get list with 2 items
        And we get producers
        """
        ["Producer 1", "Producer 2"]
        """

    @auth
    Scenario: Update producer
        Given "producers"
        """
        [{"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        When we find for "producers" the id as "producer_id" by "where={"name": "Producer 1"}"
        And we patch "/producers/#producer_id#"
        """
        {"name":"Test Producer"}
        """
        Then we get updated response

    @auth
    Scenario: Delete producer
        Given "producers"
        """
        [{"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        When we find for "producers" the id as "producer_id" by "where={"name": "Producer 1"}"
        And we delete "/producers/#producer_id#"
        Then we get deleted response
