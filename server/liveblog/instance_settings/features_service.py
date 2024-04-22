import logging
from settings import SUBSCRIPTION_LEVEL, SUBSCRIPTION_LEVEL_NETWORK

logger = logging.getLogger("liveblog")


class FeaturesService:
    """
    Service to manage feature flags based on user subscription levels.
    Loads and caches settings from a database.
    """

    def __init__(self, app, db_service):
        self.app = app
        self.db_service = db_service

        # will be loaded until it is necessary
        self._settings = None

    def load_settings(self):
        """
        Loads settings from the database into the service. If no settings are found,
        logs an error and initializes an empty settings dictionary.

        Returns:
            dict: The loaded or default settings dictionary.
        """

        db_settings = self.db_service.get_existing_config()
        settings = db_settings.get("settings", {})
        if not settings:
            logger.error(
                "No settings found in database. Please initialize the instance settings."
            )

        self._settings = settings
        return self._settings

    def get_settings(self):
        """
        Retrieves the cached settings. If settings are not loaded, it triggers the load process.

        Returns:
            dict: The current settings dictionary.
        """

        if self._settings:
            return self._settings

        return self.load_settings()

    def current_sub_level(self):
        """
        Returns the current subscription level. In the future this should fetch
        the information for the current user and return the package accordingly
        """
        return SUBSCRIPTION_LEVEL

    def is_network_subscription(self):
        return self.current_sub_level() == SUBSCRIPTION_LEVEL_NETWORK

    def is_enabled(self, feature_name):
        """
        Checks if a specific feature is enabled for the current subscription level.

        Args:
            feature_name (str): The name of the feature to check.

        Returns:
            bool: True if the feature is enabled, False otherwise.
        """

        if self.is_network_subscription():
            return True

        settings = self.get_settings()
        subscription_level = self.current_sub_level()
        features = settings.get(subscription_level, {}).get("features", {})

        return features.get(feature_name, False)
