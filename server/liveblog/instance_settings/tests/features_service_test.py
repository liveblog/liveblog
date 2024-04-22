import pytest
from unittest.mock import MagicMock
from ..features_service import FeaturesService

# Constants for the tests
SUBSCRIPTION_LEVEL = "basic"
SUBSCRIPTION_LEVEL_NETWORK = "network"


@pytest.fixture
def db_service():
    """Mock database service with a method to simulate database config retrieval."""
    db_service = MagicMock()
    db_service.get_existing_config = MagicMock()
    return db_service


@pytest.fixture
def app():
    """Mock app context."""
    return MagicMock()


@pytest.fixture
def service(app, db_service):
    """Instance of the FeaturesService with mocked dependencies."""
    return FeaturesService(app, db_service)


def test_load_settings_with_no_settings_found(db_service, service):
    """Test load_settings when no settings are present in the database."""

    db_service.get_existing_config.return_value = {}
    assert (
        service.load_settings() == {}
    ), "Should return an empty dictionary if no settings are found"
    db_service.get_existing_config.assert_called_once()


def test_load_settings_with_settings_found(db_service, service):
    """Test load_settings when settings are present."""

    expected_settings = {"settings": {"features": {"feature_x": True}}}
    db_service.get_existing_config.return_value = expected_settings
    assert (
        service.load_settings() == expected_settings["settings"]
    ), "Should return the settings from the database"


def test_get_settings_when_not_loaded(db_service, service):
    """Test get_settings to load settings if not already loaded."""

    expected_settings = {"settings": {"features": {"feature_x": True}}}
    db_service.get_existing_config.return_value = expected_settings
    assert service.get_settings() == expected_settings["settings"]
    db_service.get_existing_config.assert_called_once()


def test_get_settings_when_already_loaded(service):
    """Test get_settings when settings are already loaded."""

    service._settings = {"features": {"feature_x": True}}
    assert service.get_settings() == {"features": {"feature_x": True}}


def test_is_enabled_with_network_subscription_level(service):
    """Test is_enabled returns True when the subscription level is network."""

    service.current_sub_level = MagicMock(return_value=SUBSCRIPTION_LEVEL_NETWORK)
    assert service.is_enabled("feature_x") is True


def test_is_enabled_with_feature_off(service):
    """Test is_enabled returns False when the feature is disabled."""

    service._settings = {"basic": {"features": {"feature_x": False}}}
    service.current_sub_level = MagicMock(return_value=SUBSCRIPTION_LEVEL)
    assert service.is_enabled("feature_x") is False


def test_is_enabled_with_feature_on(service):
    """Test is_enabled returns True when the feature is enabled."""

    service._settings = {"basic": {"features": {"feature_x": True}}}
    service.current_sub_level = MagicMock(return_value=SUBSCRIPTION_LEVEL)
    assert service.is_enabled("feature_x") is True
