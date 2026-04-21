Feature: Billing endpoints

    Scenario: Config endpoint is public and returns billing settings
        When we get "/api/billing/config"
        Then we get response code 200
        And response has key "billing_required"
        And response has key "pricing_url"

    @auth
    Scenario: Status endpoint requires authentication
        When we get "/api/billing/status"
        Then we get response code 200
        And response has key "billing_required"
        And response has key "access_allowed"

    Scenario: Status endpoint rejects unauthenticated requests
        When we get "/api/billing/status"
        Then we get response code 401

    Scenario: Checkout rejects unauthenticated requests
        When we post to "/api/billing/checkout"
        """
        {"price_id": "price_123"}
        """
        Then we get response code 401

    @auth
    Scenario: Checkout returns error when Stripe is not configured
        When we post to "/api/billing/checkout"
        """
        {"price_id": "price_123", "return_url": "http://localhost"}
        """
        Then we get response code 500

    Scenario: Portal rejects unauthenticated requests
        When we post to "/api/billing/portal"
        """
        {}
        """
        Then we get response code 401

    @auth
    Scenario: Portal returns error when Stripe is not configured
        When we post to "/api/billing/portal"
        """
        {"return_url": "http://localhost"}
        """
        Then we get response code 500

    Scenario: Webhook rejects when secret is not configured
        When we post to "/api/billing/webhook"
        """
        {"type": "fake.event"}
        """
        Then we get response code 500
