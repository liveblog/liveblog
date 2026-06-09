"""
Elasticsearch filter callbacks for tenant isolation.

This module provides filter functions that can be registered in resource
datasource configurations to automatically filter Elasticsearch queries
by tenant_id.
"""

from liveblog.tenancy import get_tenant_id


def tenant_elastic_filter():
    """
    Elasticsearch filter for tenant isolation.

    Returns an Elasticsearch query filter for the current tenant. This
    function is designed to be used as an elastic_filter_callback in
    resource datasource configurations.

    The filter is applied at the Elasticsearch level before documents
    are retrieved, making it the most efficient filtering mechanism.

    Returns:
        dict: Elasticsearch filter {"term": {"tenant_id": "..."}}
        dict: {"match_none": {}} if no tenant context (returns no results)

    Example:
        In your resource definition:

        class BlogsResource(Resource):
            datasource = {
                'source': 'blogs',
                'search_backend': 'elastic',
                'elastic_filter_callback': tenant_elastic_filter
            }

    Security Note:
        Returning match_none when there's no tenant context ensures that
        unauthenticated requests return no results by default (secure by
        default approach).
    """
    tenant_id = get_tenant_id(required=False)

    if tenant_id:
        return {"term": {"tenant_id": str(tenant_id)}}

    return {"match_none": {}}


def combine_elastic_filters(*filter_callbacks):
    """
    Combine multiple elastic filter callbacks with AND logic.

    Use this when a resource needs both tenant filtering AND another
    filter (e.g., private_draft_filter for posts). All filters are
    combined using Elasticsearch's bool/must query (AND operation).

    Args:
        *filter_callbacks: Variable number of filter callback functions.
                          Each should be a callable that returns an
                          Elasticsearch filter dict.

    Returns:
        function: Combined filter function that can be used as
                 elastic_filter_callback

    Example:
        Combining tenant filter with existing post privacy filter:

        from liveblog.posts.posts import private_draft_filter
        from liveblog.tenancy.filters import combine_elastic_filters, tenant_elastic_filter

        class PostsResource(ArchiveResource):
            datasource = {
                'source': 'archive',
                'search_backend': 'elastic',
                'elastic_filter_callback': combine_elastic_filters(
                    private_draft_filter,
                    tenant_elastic_filter
                ),
                'elastic_filter': {'term': {'particular_type': 'post'}}
            }

    How it works:
        1. Each callback is called to get its filter
        2. Non-empty filters are collected
        3. If multiple filters exist, they're combined with bool/must (AND)
        4. If only one filter, it's returned as-is
        5. If no filters, empty dict is returned

    Example output:
        Single filter:
            {"term": {"tenant_id": "123"}}

        Combined filters:
            {
                "bool": {
                    "must": [
                        {"term": {"tenant_id": "123"}},
                        {"bool": {"should": [{"term": {"post_status": "open"}}, ...]}}
                    ]
                }
            }
    """

    def combined():
        filters = []

        for callback in filter_callbacks:
            if callable(callback):
                result = callback()
                if result:
                    filters.append(result)

        if not filters:
            return {}

        if len(filters) == 1:
            return filters[0]

        return {"bool": {"must": filters}}

    return combined


__all__ = ["tenant_elastic_filter", "combine_elastic_filters"]
