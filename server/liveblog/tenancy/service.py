"""
Tenant-aware service base classes for multi-tenancy support.

This module provides base service classes that automatically filter all
database queries by tenant_id, ensuring complete data isolation between
tenants.
"""
import flask

from superdesk.services import BaseService
from apps.archive.archive import ArchiveService
from bson.objectid import ObjectId
from liveblog.tenancy import get_tenant_id


class TenantAwareService(BaseService):
    """
    Base service class that automatically filters all queries by tenant_id.

    All LiveBlog services should inherit from this instead of BaseService
    to ensure tenant isolation. The service automatically adds tenant_id
    filters to all query methods (find, find_one, get, etc.) and injects
    tenant_id into new documents during creation.

    Example Usage:
        class BlogService(TenantAwareService):
            notification_key = "blog"

            def on_create(self, docs):
                super().on_create(docs)

    System Resources (DON'T use this):
        For resources that should NOT be tenant-scoped (like tenants
        themselves, or global system settings), inherit from BaseService
        directly:

        class TenantsService(BaseService):
            pass
    """

    def _add_tenant_filter(self, lookup):
        """
        Add tenant filter to lookup dictionary.

        This method is called by all query methods to inject the current
        tenant's ID into the query filter. Converts string tenant IDs to
        ObjectId format for MongoDB compatibility.

        Args:
            lookup (dict): MongoDB query lookup dictionary

        Returns:
            dict: lookup with tenant_id added (mutates input dict)

        Note:
            During HTTP requests, tenant filtering is ALWAYS required.
            During system operations (indexing, migrations), tenant filtering
            is skipped to allow system-wide access.
        """
        # During system operations (no request context), skip tenant filtering
        # This allows rebuild_elastic_index and other management commands to work
        if not flask.has_request_context():
            return lookup

        # In request context (HTTP requests), ALWAYS require tenant filtering
        tenant_id = get_tenant_id(required=True)

        if tenant_id:
            # Convert to ObjectId for MongoDB query
            # Eve stores tenant_id as ObjectId in MongoDB
            if isinstance(tenant_id, str):
                tenant_id = ObjectId(tenant_id)
            lookup["tenant_id"] = tenant_id

        return lookup

    def find(self, where=None, **kwargs):
        """
        Override find to inject tenant filter.

        Automatically adds tenant_id to the query before executing. This
        ensures all cursor-based queries are tenant-filtered.

        Args:
            where (dict): MongoDB query filter
            **kwargs: Additional arguments passed to parent

        Returns:
            Cursor: Filtered result cursor

        Example:
            blogs = self.find({'blog_status': 'open'})
        """
        if where is None:
            where = {}
        where = self._add_tenant_filter(where)
        return super().find(where, **kwargs)

    def find_one(self, req, **lookup):
        """
        Override find_one to inject tenant filter.

        Automatically adds tenant_id to single document queries. Prevents
        cross-tenant document access.

        IMPORTANT: When tenant filtering is active, we query MongoDB directly
        to avoid EveBackend's Elasticsearch fallback, which would bypass
        tenant isolation.

        Args:
            req: Request object (can be None)
            **lookup: Query parameters

        Returns:
            dict: Single document or None

        Example:
            blog = self.find_one(req=None, _id=blog_id)
        """
        from flask import current_app as app

        lookup = self._add_tenant_filter(lookup)

        # If tenant_id is in the lookup, query MongoDB directly to avoid
        # EveBackend's Elasticsearch fallback which ignores tenant_id
        if "tenant_id" in lookup:
            backend = app.data._backend(self.datasource)
            return backend.find_one(self.datasource, req=req, **lookup)
        else:
            # No tenant filter, use normal flow (allows elastic fallback)
            return super().find_one(req, **lookup)

    def get(self, req, lookup):
        """
        Override get to inject tenant filter.

        Automatically adds tenant_id to paginated query results. This is
        the main method used by HTTP GET endpoints.

        Args:
            req: ParsedRequest object with query parameters
            lookup (dict): Query filter from URL path

        Returns:
            dict: Paginated results with metadata
        """
        if lookup is None:
            lookup = {}
        lookup = self._add_tenant_filter(lookup)
        return super().get(req, lookup)

    def get_from_mongo(self, req, lookup):
        """
        Override get_from_mongo to inject tenant filter.

        This method bypasses Elasticsearch and queries MongoDB directly.
        It's critical to filter here to prevent direct access bypasses.

        Args:
            req: Request object
            lookup (dict): Query filter

        Returns:
            Cursor: MongoDB cursor with results

        Warning:
            This method bypasses Elasticsearch filters, so tenant filtering
            here is crucial for security.
        """
        if lookup is None:
            lookup = {}
        lookup = self._add_tenant_filter(lookup)
        return super().get_from_mongo(req, lookup)

    def find_and_modify(self, **kwargs):
        """
        Override find_and_modify to inject tenant filter.

        Ensures atomic read-modify-write operations are tenant-scoped.

        Args:
            **kwargs: All arguments including 'query' and 'update'

        Returns:
            dict: Modified document

        Note:
            The query kwarg is extracted, modified to include tenant_id,
            and passed to the parent's find_and_modify method.
        """
        if "query" in kwargs:
            kwargs["query"] = self._add_tenant_filter(kwargs["query"])
        return super().find_and_modify(**kwargs)

    def on_create(self, docs):
        """
        Automatically add tenant_id to new documents.

        Called before documents are inserted into database. Injects the
        current tenant's ID into all documents being created.

        Args:
            docs (list): List of documents to be created

        Note:
            During HTTP requests with authenticated users, tenant_id is required.
            During system operations, documents are created as-is (useful for
            migrations and data imports).
        """
        # Skip tenant injection during system operations (no request context)
        if not flask.has_request_context():
            super().on_create(docs)
            return

        # In request context, require and inject tenant_id
        tenant_id = get_tenant_id(required=True)

        if tenant_id:
            # Convert to ObjectId for MongoDB storage
            if isinstance(tenant_id, str):
                tenant_id = ObjectId(tenant_id)

            for doc in docs:
                if "tenant_id" not in doc:
                    doc["tenant_id"] = tenant_id

        super().on_create(docs)


class TenantAwareArchiveService(ArchiveService):
    """
    Tenant-aware version of ArchiveService for posts/items.

    Posts and items are stored in the 'archive' collection and inherit
    from ArchiveService (which provides additional archive-specific
    functionality like versioning). This class extends ArchiveService
    with tenant filtering.

    Usage:
        class PostsService(TenantAwareArchiveService):
            pass

        class ItemsService(TenantAwareArchiveService):
            pass

    Note:
        The implementation is nearly identical to TenantAwareService, but
        inherits from ArchiveService instead of BaseService to preserve
        archive-specific functionality.
    """

    def _add_tenant_filter(self, lookup):
        """
        Add tenant filter to lookup dict.

        During HTTP requests, tenant filtering is ALWAYS required.
        During system operations, tenant filtering is skipped.
        """
        # During system operations (no request context), skip tenant filtering
        if not flask.has_request_context():
            return lookup

        # In request context (HTTP requests), ALWAYS require tenant filtering
        tenant_id = get_tenant_id(required=True)

        if tenant_id:
            # Convert to ObjectId for MongoDB query
            if isinstance(tenant_id, str):
                tenant_id = ObjectId(tenant_id)
            lookup["tenant_id"] = tenant_id

        return lookup

    def find(self, where=None, **kwargs):
        """Override find to inject tenant filter."""
        if where is None:
            where = {}
        where = self._add_tenant_filter(where)
        return super().find(where, **kwargs)

    def find_one(self, req, **lookup):
        """
        Override find_one to inject tenant filter.

        IMPORTANT: When tenant filtering is active, we query MongoDB directly
        to avoid EveBackend's Elasticsearch fallback, which would bypass
        tenant isolation.
        """
        from flask import current_app as app

        lookup = self._add_tenant_filter(lookup)

        # If tenant_id is in the lookup, query MongoDB directly to avoid
        # EveBackend's Elasticsearch fallback which ignores tenant_id
        if "tenant_id" in lookup:
            backend = app.data._backend(self.datasource)
            return backend.find_one(self.datasource, req=req, **lookup)
        else:
            # No tenant filter, use normal flow (allows elastic fallback)
            return super().find_one(req, **lookup)

    def get(self, req, lookup):
        """Override get to inject tenant filter."""
        if lookup is None:
            lookup = {}
        lookup = self._add_tenant_filter(lookup)
        return super().get(req, lookup)

    def get_from_mongo(self, req, lookup):
        """Override get_from_mongo to inject tenant filter."""
        if lookup is None:
            lookup = {}
        lookup = self._add_tenant_filter(lookup)
        return super().get_from_mongo(req, lookup)

    def find_and_modify(self, **kwargs):
        """Override find_and_modify to inject tenant filter."""
        if "query" in kwargs:
            kwargs["query"] = self._add_tenant_filter(kwargs["query"])
        return super().find_and_modify(**kwargs)

    def on_create(self, docs):
        """Automatically add tenant_id to new documents."""

        # Skip tenant injection during system operations (no request context)
        if not flask.has_request_context():
            super().on_create(docs)
            return

        # In request context, require and inject tenant_id
        tenant_id = get_tenant_id(required=True)

        if tenant_id:
            # Convert to ObjectId for MongoDB storage
            if isinstance(tenant_id, str):
                tenant_id = ObjectId(tenant_id)

            for doc in docs:
                if "tenant_id" not in doc:
                    doc["tenant_id"] = tenant_id

        super().on_create(docs)


__all__ = ["TenantAwareService", "TenantAwareArchiveService"]
