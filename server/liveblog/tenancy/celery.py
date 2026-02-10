"""
Tenant-aware Celery task base classes.
"""
from celery import Task
import flask
from bson.objectid import ObjectId
from liveblog.tenancy.context import (
    set_current_tenant_id,
    reset_current_tenant_id,
    set_system_mode,
    reset_system_mode,
)


class TenantAwareTask(Task):
    """
    Base task that automatically captures tenant_id at dispatch time
    and restores it at execution time.

    At dispatch time (apply_async):
      - Extracts tenant_id from flask.g.user (if in HTTP request)
      - Stores in task headers for worker

    At execution time (__call__):
      - Restores tenant_id from headers into ContextVar
      - Task code runs with tenant context automatically

    Usage:
        @celery.task(base=TenantAwareTask)
        def my_task(doc):
            # Tenant context is automatically available
            service = get_resource_service("blogs")
            blog = service.find_one(req=None, _id=doc['blog'])
    """

    def apply_async(self, args=None, kwargs=None, **options):
        """
        Called when task is dispatched (still in HTTP request context).
        Extract tenant_id from flask.g.user and store in task headers.
        """
        tenant_id = None

        # Priority 1: Explicit tenant_id kwarg
        if kwargs and "tenant_id" in kwargs:
            tenant_id = kwargs.pop("tenant_id")

        # Priority 2: Extract from flask.g.user (HTTP request context)
        elif flask.has_request_context():
            user = flask.g.get("user")
            if user:
                tenant_id = user.get("tenant_id")

        # Priority 3: Extract from first arg if it's a document
        if not tenant_id and args and isinstance(args[0], dict):
            tenant_id = args[0].get("tenant_id")

        # Store in task headers for worker to retrieve
        if tenant_id:
            if "headers" not in options:
                options["headers"] = {}
            options["headers"]["tenant_id"] = str(tenant_id)

        return super().apply_async(args, kwargs, **options)

    def __call__(self, *args, **kwargs):
        """
        Called when task executes (in Celery worker).
        Restore tenant_id from headers into ContextVar.
        """
        tenant_id = None

        # Extract from headers (set during dispatch)
        if hasattr(self, "request") and hasattr(self.request, "headers"):
            tenant_id = self.request.headers.get("tenant_id")

        if not tenant_id:
            raise RuntimeError(
                f"TenantAwareTask '{self.name}' executed without tenant_id. "
                f"Ensure task is dispatched from authenticated request context."
            )

        # Convert to ObjectId for MongoDB queries
        if isinstance(tenant_id, str):
            tenant_id = ObjectId(tenant_id)

        # Set execution context
        token = set_current_tenant_id(tenant_id)

        try:
            return super().__call__(*args, **kwargs)
        finally:
            reset_current_tenant_id(token)


class SystemTask(Task):
    """
    Base task for system operations that bypass tenant filtering.

    Usage:
        @celery.task(base=SystemTask)
        def rebuild_index():
            # Operates across all tenants
            pass
    """

    def __call__(self, *args, **kwargs):
        token = set_system_mode()
        try:
            return super().__call__(*args, **kwargs)
        finally:
            reset_system_mode(token)


__all__ = ["TenantAwareTask", "SystemTask"]
