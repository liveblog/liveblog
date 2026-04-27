import superdesk
from superdesk.users import UsersResource
from .services import LiveBlogSystemUsersService


def init_app(app):
    endpoint_name = "users"
    service = LiveBlogSystemUsersService(endpoint_name, backend=superdesk.get_backend())
    UsersResource(endpoint_name, app=app, service=service)

    superdesk.privilege(
        name="users", label="User Management", description="User can manage users."
    )
