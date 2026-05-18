Feature: Tenant instance settings

    Scenario: Solo tenant receives solo instance settings
        Given instance settings are initialized
        And a tenant "Solo Tenant"
        And current tenant subscription level is "solo"
        And a user "solo_admin" for current tenant
        When we login as tenant user "solo_admin"
        And we get "/api/instance_settings/current"
        Then we get response code 200
        And response field "authenticated" is true
        And response field "isNetworkSubscription" is false
        And response field "limits.blogs" is 1
        And response field "limits.custom_themes" is 0
        And response field "features.marketplace" is false
        And response field "features.custom_themes" is false

    Scenario: Team tenant receives team instance settings
        Given instance settings are initialized
        And a tenant "Team Tenant"
        And current tenant subscription level is "team"
        And a user "team_admin" for current tenant
        When we login as tenant user "team_admin"
        And we get "/api/instance_settings/current"
        Then we get response code 200
        And response field "authenticated" is true
        And response field "isNetworkSubscription" is false
        And response field "limits.blogs" is 3
        And response field "limits.custom_themes" is 5
        And response field "features.marketplace" is true
        And response field "features.custom_themes" is true
