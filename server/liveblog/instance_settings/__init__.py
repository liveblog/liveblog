import superdesk
from .instance_settings import (
    instance_settings_key,
    InstanceSettingsResource,
    InstanceSettingsService,
)
from ..instance_settings.features_service import FeaturesService


def init_app(app):
    endpoint_name = instance_settings_key
    service = InstanceSettingsService(endpoint_name, backend=superdesk.get_backend())
    InstanceSettingsResource(endpoint_name, app=app, service=service)

    app.features = FeaturesService(app, service)


superdesk.privilege(
    name="instance_settings",
    label="Instance Settings Management",
    description="User can manage instance settings.",
)
