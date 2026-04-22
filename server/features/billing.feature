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
        Given billing is not configured
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
        Given billing is not configured
        When we post to "/api/billing/portal"
        """
        {"return_url": "http://localhost"}
        """
        Then we get response code 500

    Scenario: Webhook rejects when secret is not configured
        Given billing is not configured
        When we post to "/api/billing/webhook"
        """
        {"type": "fake.event"}
        """
        Then we get response code 500

    @auth
    Scenario: Billing gate blocks non-Eve writes when tenant has no subscription
        Given billing is required
        And current tenant has no subscription
        When we post raw to "/api/archive/draganddrop/"
        """
        {"image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==", "mimetype": "image/png"}
        """
        Then we get response code 403
        And response has billing error "SUBSCRIPTION_REQUIRED"

    @auth
    Scenario: Billing gate allows non-Eve writes when tenant subscription is active
        Given billing is required
        And current tenant has an active subscription
        When we post raw to "/api/archive/draganddrop/"
        """
        {"image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==", "mimetype": "image/png"}
        """
        Then we get response code 201
