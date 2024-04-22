import logging
from flask import abort, Blueprint, current_app as app
from flask_cors import CORS
from superdesk.resource import Resource
from superdesk.services import BaseService
from liveblog.validator import LiveblogValidator
from liveblog.utils.api import api_response

logger = logging.getLogger(__name__)
instance_settings_key = "instance_settings"
instance_settings_blueprint = Blueprint(instance_settings_key, __name__)
CORS(instance_settings_blueprint)


class InstanceSettingsResource(Resource):
    """
    This resources is used to store instance settings for the liveblog instance.
    The instance settings are stored as a JSON object in the settings field.
    """

    datasource = {"source": instance_settings_key}
    schema = {
        "settings": {
            "type": "dict",
            "allow_unknown": True,
        }
    }

    privileges = {"GET": instance_settings_key, "POST": instance_settings_key}


class InstanceSettingsService(BaseService):
    def on_create(self, docs):
        validator = LiveblogValidator()
        existing_config = self.get_existing_config()

        for doc in docs:
            if "settings" in doc:
                # Validate the configuration to have the required fields
                errors = validator._validate_settings(doc["settings"])
                if errors:
                    abort(
                        400,
                        description="Validation errors for config occurred: "
                        + ", ".join(errors),
                    )
                if existing_config:
                    # If there is an existing config, merge the configs
                    updated_settings = self.merge_configs(
                        existing_config.get("settings", {}), doc["settings"]
                    )
                    self.update(
                        id=existing_config["_id"],
                        updates={"settings": updated_settings},
                        original=existing_config,
                    )

        if existing_config is None:
            return super().on_create(docs)

    def create(self, docs, **kwargs):
        existing_config = self.get_existing_config()
        if existing_config:
            abort(422, description="No new config created. Existing config updated.")

        return super().create(docs, **kwargs)

    def get_existing_config(self):
        """
        Check if any config exists at all. This assumes the singleton pattern where there
        exists only one config at a time
        """
        existing_configs = list(self.get(req=None, lookup={}))
        return existing_configs[0] if existing_configs else None

    def merge_configs(self, original, new):
        """
        This function merges the new configuration into the original configuration but does not overwrite existing keys.
        It adds new keys to the original configuration only if they do not exist.
        """
        for key, value in new.items():
            if key not in original:
                original[key] = value
            elif isinstance(original[key], dict) and isinstance(value, dict):
                original[key] = self.merge_configs(original[key], value)
        return original


@instance_settings_blueprint.route("/api/instance_settings/current", methods=["GET"])
def get_instance_settings():
    """
    Returns the instance settings for the current subscription level
    """
    subscription_level = app.features.current_sub_level()
    all_settings = app.features.get_settings()

    current_settings = all_settings.get(subscription_level, {})
    current_settings["isNetworkSubscription"] = app.features.is_network_subscription()

    return api_response(current_settings, 200)
