import logging
from settings import SUBSCRIPTION_LEVEL, SUBSCRIPTION_LEVEL_NETWORK

logger = logging.getLogger("liveblog")


class FeaturesService:
    def __init__(self, app, db_service):
        self.app = app
        self.db_service = db_service

        # will be loaded until it is necessary
        self._settings = None

    def load_settings(self):
        db_settings = self.db_service.get_existing_config()
        self._settings = db_settings.get("settings", {})

        if self._settings is None:
            logger.error(
                "No settings found in database. Please initialize the instance settings"
            )
            self._settings = {}

        return self._settings

    def get_settings(self):
        if self._settings:
            return self._settings

        return self.load_settings()

    def _current_sub_level(self):
        """
        Returns the current subscription level. In the future this should fetch
        the information for the current user and return the package accordingly
        """
        return SUBSCRIPTION_LEVEL

    def _is_network_subscription(self):
        return self._current_sub_level() == SUBSCRIPTION_LEVEL_NETWORK

    def is_enabled(self, feature_name):
        """
        Checks if the given feature is enabled for the current subscription level
        that is taken from the settings
        """
        if self._is_network_subscription():
            return True

        settings = self.get_settings()
        if not settings:
            return False

        subscription_level = self._current_sub_level()
        features = settings.get(subscription_level, {}).get("features", {})

        if not features:
            return False

        return features.get(feature_name)
