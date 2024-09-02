import requests
from unittest.mock import Mock
from ..tasks import get_bandwidth_used


def test_get_bandwidth_used_successful_response():
    mock_response = Mock(spec=requests.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
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

    bandwidth_used = get_bandwidth_used(mock_response)
    assert bandwidth_used == 4368479


def test_get_bandwidth_used_api_error():
    mock_response = Mock(spec=requests.Response)
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"
    bandwidth_used = get_bandwidth_used(mock_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_with_errors_in_response():
    mock_response = Mock(spec=requests.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {"viewer": {"zones": []}},
        "errors": ["Some error occurred"],
    }
    bandwidth_used = get_bandwidth_used(mock_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_no_zones_data():
    mock_response = Mock(spec=requests.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {"viewer": {"zones": []}},
        "errors": None,
    }
    bandwidth_used = get_bandwidth_used(mock_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_no_httpRequestsAdaptiveGroups():
    mock_response = Mock(spec=requests.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {"viewer": {"zones": [{"httpRequestsAdaptiveGroups": []}]}},
        "errors": None,
    }
    bandwidth_used = get_bandwidth_used(mock_response)
    assert bandwidth_used is None


def test_get_bandwidth_used_no_edgeResponseBytes():
    mock_response = Mock(spec=requests.Response)
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "data": {"viewer": {"zones": [{"httpRequestsAdaptiveGroups": [{"sum": {}}]}]}},
        "errors": None,
    }

    bandwidth_used = get_bandwidth_used(mock_response)
    assert bandwidth_used is None
