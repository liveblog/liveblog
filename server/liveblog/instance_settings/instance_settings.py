import flask
import logging

from copy import deepcopy
from bson import ObjectId
from cerberus import Validator
from flask_cors import CORS
from flask import Blueprint, current_app as app

from superdesk.resource import Resource
from superdesk.errors import SuperdeskApiError
from superdesk.services import BaseService
from superdesk.notification import push_notification
from liveblog.utils.api import api_response

logger = logging.getLogger(__name__)
instance_settings_key = "instance_settings"
instance_settings_blueprint = Blueprint(instance_settings_key, __name__)
CORS(instance_settings_blueprint)


INSTANCE_SETTINGS_SCHEMA = {
    "settings": {
        "type": "dict",
        "valueschema": {
            "type": "dict",
            "allow_unknown": True,
            "schema": {
                "features": {"required": True, "type": "dict"},
                "limits": {"required": True, "type": "dict"},
            },
        },
        "allow_unknown": True,
    }
}


class InstanceSettingsResource(Resource):
    """
    This resources is used to store instance settings for the liveblog instance.
    The instance settings are stored as a JSON object in the settings field.
    """

    datasource = {"source": instance_settings_key, "search_backend": "elastic"}
    schema = INSTANCE_SETTINGS_SCHEMA.copy()

    privileges = {"GET": instance_settings_key, "POST": instance_settings_key}

    item_methods = ["GET", "PATCH", "PUT", "DELETE"]
    RESOURCE_METHODS = ["GET", "POST", "PATCH"]


class InstanceSettingsService(BaseService):
    def is_user_authorized(self):
        """
        Checks if the user is allowed to execute actions over instance settings
        """
        if not getattr(flask.g, "user", None):
            return False

        return flask.g.user.get("is_support", False)

    def get(self, req, lookup):
        """
        Retrieve instance settings directly from MongoDB, bypassing the Elasticsearch.
        This ensures that the most up-to-date configuration is returned to the client.
        """
        return self.get_from_mongo(req, lookup)

    def create(self, docs, **kwargs):
        # skip permissions if it's comming from initialize_data command
        if not app.is_initialize_data and not self.is_user_authorized():
            raise SuperdeskApiError.forbiddenError(
                message="You do not have permissions to execute this action."
            )

        doc = docs[0] if len(docs) > 0 else None
        if not doc:
            raise SuperdeskApiError.badRequestError(
                message="Please provide the settings"
            )

        self.validate_payload(doc["settings"])
        existing_config = self.get_existing_config()

        if existing_config and "_id" in existing_config:
            # Merge existing config with new settings
            existing_settings = deepcopy(existing_config.get("settings", {}))
            merged_settings = self.deep_merge(existing_settings, doc["settings"])

            try:
                self.patch(
                    ObjectId(existing_config["_id"]), dict(settings=merged_settings)
                )
                return [existing_config["_id"]]
            except SuperdeskApiError as e:
                if e.status_code == 404:
                    # If the document is missing, fallback to creating a new one
                    return super().create(docs, **kwargs)
                else:
                    raise  # re-raise other errors
        else:
            return super().create(docs, **kwargs)

    def on_created(self, docs):
        app.features.load_settings()
        return super().on_created(docs)

    def on_updated(self, updates, original):
        app.features.load_settings()
        push_notification("instance_settings:updated")
        return super().on_updated(updates, original)

    def validate_payload(self, settings):
        """
        This validates the incoming settings against the defined resource schema
        using Cerberus validation mechanism
        """
        validator = Validator(INSTANCE_SETTINGS_SCHEMA)
        if not validator.validate({"settings": settings}):
            errors = validator.errors["settings"]

            raise SuperdeskApiError.badRequestError(
                message=f"Settings validation errors: {self.format_errors(errors)}",
            )

    def format_errors(self, errors, key_path=""):
        """
        Recursively formats validation errors into a human-readable string.
        Returns: Formatted string describing the errors.
        """

        if isinstance(errors, dict):
            messages = []
            for key, value in errors.items():
                new_key_path = f"{key_path}.{key}" if key_path else key

                if isinstance(value, dict):
                    messages.append(self.format_errors(value, new_key_path))
                else:
                    messages.append(f"'{new_key_path}' {value}")

            return " ".join(messages)
        else:
            return f"'{key_path}' {errors}"

    def get_existing_config(self):
        """
        Check if any config exists at all. This assumes the singleton pattern where there
        exists only one config at a time.
        """
        try:
            config = self.get_from_mongo(req=None, lookup={})[0]
            if config and "_id" in config:
                return config
            return {}
        except IndexError:
            return {}

    def deep_merge(self, existing, incoming):
        """
        Recursively merge incoming settings into the existing ones
        without wiping out nested structures.

        This is especially useful during initialization when we want to apply
        new or default settings but keep any changes the user has already made.
        It carefully updates only what's needed — preserving existing values,
        updating changed ones, and adding any new keys that weren’t there before.
        That way, we don’t lose custom configurations, and we still apply updates cleanly.
        """
        for key, value in incoming.items():
            if key in existing:
                if isinstance(existing[key], dict) and isinstance(value, dict):
                    self.deep_merge(existing[key], value)
                else:
                    # Only overwrite if the existing key is not meaningful
                    existing[key] = value
            else:
                existing[key] = value
        return existing


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
