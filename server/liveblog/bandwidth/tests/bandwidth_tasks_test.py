from liveblog.bandwidth.tasks import get_bandwidth_used


def test_get_bandwidth_used_successful_response():
    json_response = {
        "data": {
            "viewer": {
                "zones": [
                    {
                        "httpRequestsAdaptiveGroups": [
                            {"sum": {"edgeResponseBytes": 4368479}}
                        ]
                    }
                ]
            }
        },
        "errors": None,
    }

    bandwidth_used = get_bandwidth_used(json_response)
    assert bandwidth_used == 4368479


def test_get_bandwidth_used_api_error():
    # Simulates a non-JSON response or failed request
    json_response = {}
    bandwidth_used = get_bandwidth_used(json_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_with_errors_in_response():
    json_response = {
        "data": {"viewer": {"zones": []}},
        "errors": ["Some error occurred"],
    }
    bandwidth_used = get_bandwidth_used(json_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_no_zones_data():
    json_response = {
        "data": {"viewer": {"zones": []}},
        "errors": None,
    }
    bandwidth_used = get_bandwidth_used(json_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_no_httpRequestsAdaptiveGroups():
    json_response = {
        "data": {"viewer": {"zones": [{"httpRequestsAdaptiveGroups": []}]}},
        "errors": None,
    }
    bandwidth_used = get_bandwidth_used(json_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_no_edgeResponseBytes():
    json_response = {
        "data": {"viewer": {"zones": [{"httpRequestsAdaptiveGroups": [{"sum": {}}]}]}},
        "errors": None,
    }

    bandwidth_used = get_bandwidth_used(json_response)
    assert bandwidth_used is None
