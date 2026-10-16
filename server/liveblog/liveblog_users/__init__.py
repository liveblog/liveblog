import superdesk
from .resources import LiveBlogUsersResource
from .services import LiveBlogUsersService


def init_app(app):
    """
    Initialize the liveblog_users resource.

    Registers /api/liveblog_users endpoint for tenant-aware user management.
    This is separate from system-level /api/users managed by superdesk-core.
    """
    endpoint_name = "liveblog_users"
    service = LiveBlogUsersService(endpoint_name, backend=superdesk.get_backend())
    LiveBlogUsersResource(endpoint_name, app=app, service=service)

    superdesk.privilege(
        name="liveblog_users",
        label="LiveBlog User Management",
        description="User can manage LiveBlog users within their tenant.",
    )
