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
    Scenario: Check if api_url is unique
        Given empty "producers"
        When we post to "producers"
        """
        [{"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        Then we get OK response
        When we post to "producers"
        """
        [{"name": "Producer 2", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        Then we get response code 400
        When we post to "producers"
        """
        [{"name": "Producer 3", "api_url": "http://localhost:5000/api", "consumer_api_key": "__any_value__"}]
        """
        Then we get response code 400

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
    Scenario: Update producer with unsecure url
        Given "producers"
        """
        [{"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        When we find for "producers" the id as "producer_id" by "where={"name": "Producer 1"}"
        And we patch "/producers/#producer_id#"
        """
        {"api_url":"http://liveblog.sourcefabric.org/"}
        """
        Then we get response code 400

    @auth
    Scenario: Delete producer
        Given "producers"
        """
        [{"name": "Producer 1", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}]
        """
        When we find for "producers" the id as "producer_id" by "where={"name": "Producer 1"}"
        And we delete "/producers/#producer_id#"
        Then we get deleted response

    @auth
    Scenario: List producer blogs
        Given "themes"
        """
        [{"name": "forest"}]
        """
        Given "blogs"
        """
        [
            {
                "title": "testBlog",
                "blog_status": "open",
                "syndication_enabled": true,
                "blog_preferences": {"theme": "forest", "language": "fr"}
            },
            {
                "title": "testBlog2",
                "blog_status": "open",
                "syndication_enabled": false,
                "blog_preferences": {"theme": "forest", "language": "fr"}
            }
        ]
        """
        Given "consumers"
        """
        [
            {"name": "Consumer", "api_url": "http://localhost:5000/api", "contacts": [{"first_name": "Foo", "last_name": "Bar", "email": "foo@bar.tld", "phone": "+49123456789"}], "api_key": "__any_value__"}
        ]
        """
        Given "producers"
        """
        [
            {"name": "Producer", "api_url": "http://localhost:5000/api/", "consumer_api_key": "__any_value__"}
        ]
        """
        Then we get "#producers._id#" blogs from producer blogs endpoint
