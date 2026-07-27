import superdesk
from superdesk.users import UsersResource
from .services import LiveBlogSystemUsersService


class LiveBlogSystemUsersResource(UsersResource):
    """
    System-level users resource, not exposed over REST. All REST access to
    users goes through the tenant-scoped liveblog_users endpoint; this
    resource exists only for internal get_resource_service("users") access.
    """

    internal_resource = True


def init_app(app):
    endpoint_name = "users"
    service = LiveBlogSystemUsersService(endpoint_name, backend=superdesk.get_backend())
    LiveBlogSystemUsersResource(endpoint_name, app=app, service=service)

    superdesk.privilege(
        name="users", label="User Management", description="User can manage users."
    )
