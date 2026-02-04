from superdesk.users.services import DBUsersService
from liveblog.tenancy.service import TenantAwareService


class LiveBlogUsersService(TenantAwareService, DBUsersService):
    """
    Tenant-aware users service for LiveBlog.

    This service is used for all tenant-level user operations (blog management,
    posts, UI user listings). It automatically filters all queries by tenant_id.

    System-level operations (authentication, registration, preferences) use the
    system 'users' service which has no tenant filtering.

    Architecture:
    - /api/users → system service (internal_resource, used by superdesk-core)
    - /api/liveblog_users → this service (public API, tenant-filtered)
    """
    pass
