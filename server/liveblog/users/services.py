import flask
from flask import current_app as app
from superdesk.users.services import DBUsersService
from liveblog.tenancy.service import TenantAwareService


class TenantAwareDBUsersService(TenantAwareService, DBUsersService):
    def system_find_one(self, req=None, **lookup):
        """
        Find user without tenant filtering for system operations.

        Bypasses tenant filtering for system-level queries that need to
        operate across all tenants. This includes:
        - Authentication (looking up users by token before tenant context exists)
        - Registration (checking duplicate usernames/emails globally)
        - System admin operations
        - Migration scripts

        WARNING: Use sparingly. This returns users from ANY tenant.

        Follows the same naming convention as system_update() in superdesk.

        Args:
            req: Request object (can be None)
            **lookup: Query parameters (e.g., _id=..., username=..., email=...)

        Returns:
            dict: User document or None

        Example:
            # For authentication by user ID
            user = users_service.system_find_one(req=None, _id=user_id)

            # For registration duplicate check
            existing = users_service.system_find_one(req=None, username="john")
        """
        from bson.objectid import ObjectId

        # Convert string IDs to ObjectId if needed
        if "_id" in lookup and isinstance(lookup["_id"], str):
            lookup["_id"] = ObjectId(lookup["_id"])

        return DBUsersService.find_one(self, req, **lookup)

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

    def on_created(self, docs):
        """
        Override to handle activation emails without tenant filtering issues.

        Re-implements parent logic but sends activation emails using a custom
        method that doesn't require user lookup from database.
        """
        from superdesk.activity import add_activity, ACTIVITY_CREATE
        from superdesk import get_resource_service
        from superdesk.errors import SuperdeskApiError

        resetService = get_resource_service("reset_user_password")
        activate_ttl = app.config["ACTIVATE_ACCOUNT_TOKEN_TIME_TO_LIVE"]

        for user_doc in docs:
            # Add activity log for audit trail
            add_activity(
                ACTIVITY_CREATE,
                "created user {{user}}",
                self.datasource,
                user=user_doc.get("display_name", user_doc.get("username")),
            )

            # Send activation email if needed
            if self.user_is_waiting_activation(user_doc):
                tokenDoc = {"user": user_doc["_id"], "email": user_doc["email"]}
                token_id = resetService.store_reset_password_token(
                    tokenDoc, user_doc["email"], activate_ttl, user_doc["_id"]
                )

                if not token_id:
                    raise SuperdeskApiError.internalError(
                        "Failed to send account activation email."
                    )

                # tokenDoc now has 'token' field set by store_reset_password_token
                # Send activation email without user lookup (we already have user_doc)
                self._send_activation_email(user_doc, tokenDoc["token"], activate_ttl)

    def _send_activation_email(self, user, token, activate_ttl):
        """
        Send activation email without requiring tenant context.

        Unlike superdesk's send_activate_account_email(), this doesn't need to
        look up the user (which would fail during registration due to tenant filtering).
        We already have the user document, so we pass it directly.
        """
        from flask import render_template
        from superdesk.emails import send_email

        first_name = user.get("first_name")
        app_name = app.config["APPLICATION_NAME"]
        admins = app.config["ADMINS"]
        client_url = app.config["CLIENT_URL"]
        url = "{}/#/reset-password?token={}".format(client_url, token)
        hours = activate_ttl * 24

        subject = render_template("account_created_subject.txt", app_name=app_name)
        text_body = render_template(
            "account_created.txt",
            app_name=app_name,
            user=user,
            first_name=first_name,
            instance_url=client_url,
            expires=hours,
            url=url,
        )
        html_body = render_template(
            "account_created.html",
            app_name=app_name,
            user=user,
            first_name=first_name,
            instance_url=client_url,
            expires=hours,
            url=url,
        )

        send_email.delay(
            subject=subject,
            sender=admins[0],
            recipients=[user["email"]],
            text_body=text_body,
            html_body=html_body,
        )

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
