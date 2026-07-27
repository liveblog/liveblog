from superdesk.notification import push_notification
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

    def on_create(self, docs):
        for doc in docs:
            # Support users are provisioned via CLI only, never through REST
            doc.pop("is_support", None)
        super().on_create(docs)

    def on_update(self, updates, original):
        # Strip fields a tenant client must never change: is_support is
        # CLI-provisioned and tenant_id is immutable after creation. The REST
        # PATCH is already schema-blocked from setting tenant_id, so this pop
        # also guards internal service.patch callers.
        updates.pop("is_support", None)
        updates.pop("tenant_id", None)
        super().on_update(updates, original)

    def on_created(self, docs):
        super().on_created(docs)
        push_notification("users:created")
