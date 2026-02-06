from superdesk.users import UsersResource


class LiveBlogUsersResource(UsersResource):
    """
    Tenant-aware users resource for LiveBlog.

    Inherits schema and settings from superdesk.users.UsersResource
    but uses tenant-aware service for data isolation.

    Key differences from system users:
    - All queries filtered by tenant_id
    - Users belong to a single tenant
    - Endpoint: /api/liveblog_users
    - Same MongoDB collection: 'users'
    """

    # Set as class attribute - both /api/users and /api/liveblog_users use 'users' collection
    datasource = {"source": "users"}

    def __init__(self, endpoint_name, app, service, endpoint_schema=None):
        # Call parent init first to set up schema
        super().__init__(endpoint_name, app, service, endpoint_schema)

        # After parent sets datasource, ensure 'source' is 'users' collection
        # The difference is that LiveBlogUsersService adds tenant filtering
        if self.datasource is None:
            self.datasource = {}
        self.datasource["source"] = "users"
