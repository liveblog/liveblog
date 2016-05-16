Feature: Prepopulate

    @auth
    @dbauth
    Scenario: Prepopulate and erase
        Given empty "roles"
        Given empty "users"

        When we post to "/prepopulate"
        """
        {}
        """
        Then we get new resource
        """
        {"_status": "OK"}
        """

        When we setup test user

        When we get "/users"
        Then we get list with 2 items
        """
        {"_items": [{"username":"admin", "first_name":"first name", "last_name":"last name", "user_type": "administrator", "email": "a@a.com"},
                   {"username": "test_user"}]}
        """

        When we get "/roles"
        Then we get list with 2 items
        """
        {"_items": [
            {"name": "Editor"}, {"name": "Contributor"}
        ]}
        """

    @auth
    @dbauth
    @notesting
    Scenario: Prepopulate and app not on testing mode
        Given empty "roles"

        When we post to "/prepopulate"
        """
        {}
        """
        Then we get error 404


    @auth
    @dbauth
    Scenario: Prepopulate and no erase
        Given empty "roles"

        When we post to "/users"
        """
        {"first_name": "foo", "username": "foo", "password": "barbar", "email": "foo@bar.com", "sign_off": "abc"}
        """
        Then we get new resource
        """
        {"username": "foo", "email": "foo@bar.com"}
        """

        When we post to "/prepopulate"
        """
        {"remove_first": false}
        """
        Then we get new resource
        """
        {"_status": "OK"}
        """

        When we get "/users"
        Then we get list with 3 items
        """
        {"_items": [{"username":"admin", "first_name":"first name", "last_name":"last name", "user_type": "administrator", "email": "a@a.com"},
                    {"username": "foo", "email": "foo@bar.com"},
                    {"username": "test_user"}]}
        """


    @auth
    @dbauth
    Scenario: Prepopulate with custom profile
        Given empty "roles"

        When we post to "/prepopulate"
        """
        {"profile": "app_prepopulate_data_test"}
        """
        Then we get new resource
        """
        {"_status": "OK"}
        """

        When we setup test user

        When we get "/users"
        Then we get list with 2 items
        """
        {"_items": [{"username":"admin_other", "first_name":"first name other", "last_name":"last name other", "user_type": "administrator", "email": "a@a_other.com"},
                   {"username": "test_user"}]}
        """

        When we get "/roles"
        Then we get list with 0 items
