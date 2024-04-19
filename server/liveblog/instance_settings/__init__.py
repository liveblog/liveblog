import superdesk
from .instance_settings import (
    instance_settings_key,
    InstanceSettingsResource,
    InstanceSettingsService,
)


def init_app(app):
    endpoint_name = instance_settings_key
    service = InstanceSettingsService(endpoint_name, backend=superdesk.get_backend())
    InstanceSettingsResource(endpoint_name, app=app, service=service)
