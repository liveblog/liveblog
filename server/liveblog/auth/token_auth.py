import flask
from datetime import timedelta
from flask import request, current_app as app
from apps.auth import SuperdeskTokenAuth
from superdesk import get_resource_service
from superdesk.utc import utcnow


class LiveBlogTokenAuth(SuperdeskTokenAuth):
    """
    Tenant-aware token authentication.

    Overrides user lookup during authentication to bypass tenant filtering,
    since auth tokens are system-level (not tenant-scoped).
    """

    def check_auth(self, token, allowed_roles, resource, method):
        """
        Validate auth token and set request context.

        Uses system_find_one to avoid circular dependency:
        tenant filtering needs flask.g.user, but we're setting it here.

        Args:
            token: Authentication token
            allowed_roles: Allowed roles for resource
            resource: Resource being accessed
            method: HTTP method

        Returns:
            bool: True if authorized, raises exception otherwise
        """
        auth_service = get_resource_service("auth")
        user_service = get_resource_service("users")
        auth_token = auth_service.find_one(token=token, req=None)

        if auth_token:
            user_id = str(auth_token["user"])
            flask.g.user = user_service.system_find_one(req=None, _id=user_id)
            flask.g.role = user_service.get_role(flask.g.user)
            flask.g.auth = auth_token
            flask.g.auth_value = auth_token["user"]

            if (
                method in ("POST", "PUT", "PATCH")
                or method == "GET"
                and not request.args.get("auto")
            ):
                now = utcnow()
                if auth_token[app.config["LAST_UPDATED"]] + timedelta(seconds=30) < now:
                    auth_service.update_session({app.config["LAST_UPDATED"]: now})

            return self.check_permissions(resource, method, flask.g.user)
