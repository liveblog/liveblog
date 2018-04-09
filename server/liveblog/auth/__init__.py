from apps.auth import AuthResource
from liveblog.auth.db import AccessAuthService
import superdesk


def init_app(app):
    endpoint_name = 'auth_db'
    service = AccessAuthService('auth', backend=superdesk.get_backend())
    AuthResource(endpoint_name, app=app, service=service)

superdesk.intrinsic_privilege('auth_db', method=['DELETE'])
