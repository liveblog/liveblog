import superdesk
from liveblog.validator import LiveblogValidator
from .global_preferences import preferences_key, GlobalPreferencesResource, GlobalPreferencesService


def init_app(app):
    endpoint_name = preferences_key
    service = GlobalPreferencesService(endpoint_name, backend=superdesk.get_backend())
    GlobalPreferencesResource(endpoint_name, app=app, service=service)
    app.validator = LiveblogValidator


superdesk.privilege(name='global_preferences', label='Global Settings Management',
                    description='User can access global settings.')
