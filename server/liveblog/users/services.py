import flask
from flask import current_app as app
from superdesk.users.services import DBUsersService
from liveblog.tenancy.service import TenantAwareService


class TenantAwareDBUsersService(TenantAwareService, DBUsersService):
    def find_one_for_authentication(self, user_id):
        """
        Find user by ID for authentication only.

        Bypasses tenant filtering since auth tokens are system-level.
        ONLY use this for auth token validation.
        """
        from bson.objectid import ObjectId

        if isinstance(user_id, str):
            user_id = ObjectId(user_id)

        return DBUsersService.find_one(self, req=None, _id=user_id)

    def on_create(self, docs):
        """
        Make tenant_id optional for users.

        Users can be created without tenant context (e.g., initial setup, registration).
        """
        from liveblog.tenancy import get_tenant_id
        from bson.objectid import ObjectId

        tenant_id = get_tenant_id(required=False)

        if tenant_id:
            if isinstance(tenant_id, str):
                tenant_id = ObjectId(tenant_id)

            for doc in docs:
                if "tenant_id" not in doc:
                    doc["tenant_id"] = tenant_id

        DBUsersService.on_create(self, docs)


class LiveBlogUserService(TenantAwareDBUsersService):
    """
    Extends superdesk.users default app to add some additional functionality
    only concerning Live Blog, like hiding users' sensitive information for users
    that do not have enough permissions to do so.

    Now includes tenant isolation - users are automatically scoped to their tenant.
    """

    def on_fetched(self, document):
        super().on_fetched(document)

        for doc in document["_items"]:
            self.__hide_sensitive_data(doc)

    def on_fetched_item(self, doc):
        super().on_fetched_item(doc)
        self.__hide_sensitive_data(doc)

    def __hide_sensitive_data(self, doc):
        """Set default fields for users"""

        if flask.g.user["_id"] == doc["_id"]:
            return

        if app.config["HIDE_USERS_SENSITIVE_DATA"]:
            doc["email"] = "hidden"
            doc["first_name"] = "hidden"
