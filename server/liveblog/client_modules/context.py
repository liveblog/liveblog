from contextlib import contextmanager

import flask
from superdesk import get_resource_service
from liveblog.tenancy import get_tenant_id
from liveblog.tenancy.context import tenant_context_from_blog


@contextmanager
def public_tenant_context(service, doc_id):
    """Fetch a document by ID and establish tenant context from its blog reference.

    Designed for public (unauthenticated) client endpoints where no tenant context
    exists yet. Fetches the document directly from the service's backend, resolves
    its blog, and sets tenant context for the duration of the block.

    Yields None (without setting any context) when:
    - doc_id is falsy
    - There is no active Flask request context
    - A tenant context already exists (authenticated user or prior context setup)
    - The document is not found
    - The document's blog reference is missing or invalid

    When None is yielded, callers should fall through to their parent's
    tenant-filtered find_one().

    Args:
        service: Eve service instance (must have .backend and .datasource)
        doc_id: The document's _id to look up

    Yields:
        dict: The fetched document within the correct tenant context
        None: If the lookup should fall through to the parent service

    Usage:
        class ClientItemsService(ItemsService):
            def find_one(self, req, **lookup):
                with public_tenant_context(self, lookup.get("_id")) as doc:
                    if doc is not None:
                        return doc
                return super().find_one(req, **lookup)
    """
    if not doc_id or not flask.has_request_context() or get_tenant_id(required=False):
        yield None
        return

    doc = service.backend.find_one(service.datasource, req=None, _id=doc_id)
    if not doc:
        yield None
        return

    blog = get_resource_service("client_blogs").find_one(req=None, _id=doc.get("blog"))
    if not blog:
        yield None
        return

    with tenant_context_from_blog(blog):
        yield doc
