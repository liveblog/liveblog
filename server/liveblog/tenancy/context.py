"""
Tenant execution context using contextvars.

This allows tenant_id to be propagated across async boundaries
(like Celery tasks) without relying on Flask request context.
"""
from contextlib import contextmanager
from contextvars import ContextVar


# Execution context for current tenant
_tenant_context = ContextVar("current_tenant_id", default=None)

# Sentinel value for system operations
SYSTEM_MODE = "__SYSTEM__"


def set_current_tenant_id(tenant_id):
    """
    Set the current tenant_id in execution context.

    Args:
        tenant_id: ObjectId or string tenant identifier

    Returns:
        token: Previous value (use for reset in finally block)
    """
    return _tenant_context.set(tenant_id)


def get_current_tenant_id():
    """
    Get current tenant_id from execution context.

    Returns:
        ObjectId/str: tenant_id if set
        None: if no tenant context
        "__SYSTEM__": if in system mode
    """
    return _tenant_context.get()


def reset_current_tenant_id(token):
    """
    Reset tenant context to previous value.

    Args:
        token: Token returned from set_current_tenant_id()
    """
    _tenant_context.reset(token)


def set_system_mode():
    """
    Mark current execution as system operation (bypasses tenant filtering).

    Returns:
        token: Previous value (use for reset in finally block)
    """
    return _tenant_context.set(SYSTEM_MODE)


def reset_system_mode(token):
    """
    Exit system mode.

    Args:
        token: Token returned from set_system_mode()
    """
    _tenant_context.reset(token)


@contextmanager
def tenant_context_from_blog(blog):
    """
    Context manager for public endpoints that need tenant context but have no authenticated user.

    Derives tenant_id from an already-fetched blog document and sets it for the duration
    of the block. Does nothing if tenant context is already established (authenticated
    requests or Celery TenantAwareTask).

    Usage:
        blog = get_resource_service("client_blogs").find_one(req=None, _id=blog_id)
        with tenant_context_from_blog(blog):
            # service calls here see the correct tenant
    """
    tenant_id = blog.get("tenant_id") if blog else None
    if get_current_tenant_id() is not None or not tenant_id:
        yield
        return
    token = set_current_tenant_id(tenant_id)
    try:
        yield
    finally:
        reset_current_tenant_id(token)


__all__ = [
    "set_current_tenant_id",
    "get_current_tenant_id",
    "reset_current_tenant_id",
    "set_system_mode",
    "reset_system_mode",
    "tenant_context_from_blog",
    "SYSTEM_MODE",
]
