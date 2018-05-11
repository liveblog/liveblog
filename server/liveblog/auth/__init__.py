import superdesk
from apps.auth import AuthResource
from liveblog.auth.db import AccessAuthService

from apps.auth.db.reset_password import ResetPasswordService, ResetPasswordResource, ActiveTokensResource
from apps.auth.db.change_password import ChangePasswordService, ChangePasswordResource


def init_app(app):
    endpoint_name = 'auth_db'
    service = AccessAuthService('auth', backend=superdesk.get_backend())
    AuthResource(endpoint_name, app=app, service=service)

    endpoint_name = 'reset_user_password'
    service = ResetPasswordService(endpoint_name, backend=superdesk.get_backend())
    ResetPasswordResource(endpoint_name, app=app, service=service)

    endpoint_name = 'change_user_password'
    service = ChangePasswordService(endpoint_name, backend=superdesk.get_backend())
    ChangePasswordResource(endpoint_name, app=app, service=service)

    endpoint_name = 'active_tokens'
    service = superdesk.Service(endpoint_name, backend=superdesk.get_backend())
    ActiveTokensResource(endpoint_name, app=app, service=service)


superdesk.intrinsic_privilege('auth_db', method=['DELETE'])
