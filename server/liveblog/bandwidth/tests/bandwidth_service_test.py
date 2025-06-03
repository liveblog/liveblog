from bson import ObjectId
import pytest
from unittest.mock import MagicMock, patch
from flask import Flask
from liveblog.bandwidth.bandwidth import (
    BandwidthService,
    bandwidth_blueprint,
)


@pytest.fixture
def app():
    app = Flask(__name__)
    app.config["SERVER_NAME"] = "localhost"
    app.config["APPLICATION_NAME"] = "TestApp"
    app.config["ADMINS"] = ["admin@test.com"]
    app.register_blueprint(bandwidth_blueprint)
    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def bandwidth_service():
    return BandwidthService()


def test_get_current_bandwidth(bandwidth_service):
    """Test the get_current_bandwidth method when bandwidth exists."""
    mock_bandwidth = {"bandwidthUsage": 1024}
    bandwidth_service.get = MagicMock(return_value=[mock_bandwidth])
    bandwidth_service.get_from_mongo = MagicMock(return_value=[mock_bandwidth])
    result = bandwidth_service.get_current_bandwidth()
    assert result == mock_bandwidth


def test_get_current_bandwidth_no_data(bandwidth_service):
    """Test the get_current_bandwidth method when no bandwidth data exists."""
    bandwidth_service.get = MagicMock(return_value=[])
    bandwidth_service.get_from_mongo = MagicMock(return_value=[])
    result = bandwidth_service.get_current_bandwidth()
    assert result == {}


def test_update_bandwidth_usage(bandwidth_service):
    """Test the update_bandwidth_usage method."""
    mock_original = {"_id": "60a6c49c1c9d440000c57f40", "bandwidthUsage": 1024}
    mock_updates = {"bandwidthUsage": 2048}
    bandwidth_service.patch = MagicMock()
    bandwidth_service.update_bandwidth_usage(mock_original, mock_updates)
    bandwidth_service.patch.assert_called_once_with(
        ObjectId(mock_original["_id"]), mock_updates
    )


def test_compute_new_bandwidth_usage(bandwidth_service):
    """Test compute_new_bandwidth_usage method."""
    mock_current_bandwidth = {"bandwidthUsage": 1024}
    bandwidth_service.get_current_bandwidth = MagicMock(
        return_value=mock_current_bandwidth
    )
    bandwidth_service.update_bandwidth_usage = MagicMock()
    bandwidth_service.send_alerts_if_bandwidth_exceeded = MagicMock()
    bandwidth_service.compute_new_bandwidth_usage(1024)
    bandwidth_service.update_bandwidth_usage.assert_called_once_with(
        mock_current_bandwidth, {"bandwidthUsage": 2048}
    )
    bandwidth_service.send_alerts_if_bandwidth_exceeded.assert_called_once_with(2048)


def test_get_instance_bandwidth(client, app):
    """Test the get_instance_bandwidth API endpoint."""
    with patch(
        "liveblog.bandwidth.bandwidth.get_resource_service"
    ) as mock_get_resource_service:
        mock_bandwidth_service = MagicMock()
        mock_get_resource_service.return_value = mock_bandwidth_service
        mock_bandwidth_service.get_current_bandwidth.return_value = {
            "bandwidthUsage": 1024**3
        }
        app.features = MagicMock()
        app.features.is_bandwidth_limit_enabled = MagicMock(return_value=True)
        app.features.get_feature_limit = MagicMock(return_value=2)

        response = client.get("/api/bandwidth/current")
        data = response.get_json()

        assert response.status_code == 200
        assert data["bandwidthUsageGB"] == 1.0
        assert data["percentageUsed"] == 50.0
        assert data["bandwidthLimit"] is True
