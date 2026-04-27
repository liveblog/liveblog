import flask
from datetime import timedelta
from flask import request, current_app as app
from apps.auth import SuperdeskTokenAuth
from superdesk import get_resource_service
from superdesk.utc import utcnow


def _touch_auth_session(auth_service, auth_token, method):
    """Refresh the auth session timestamp at most once per request."""
    if flask.g.get("auth_session_touched"):
        return

    # NOTE: `?auto=...` is inherited from Superdesk auth/session handling.
    # It appears to skip session-touching for automatic GET requests, but
    # it is not a known LiveBlog convention.
    # TODO: Verify whether LiveBlog still needs this inherited behavior.
    if method in ("POST", "PUT", "PATCH") or (
        method == "GET" and not request.args.get("auto")
    ):
        now = utcnow()
        if auth_token[app.config["LAST_UPDATED"]] + timedelta(seconds=30) < now:
            auth_service.update_session({app.config["LAST_UPDATED"]: now})

    flask.g.auth_session_touched = True


def get_authenticated_user_from_context():
    """Return the authenticated user already stored on the current request."""
    return flask.g.get("user")


def get_request_auth_token():
    """Return the current request auth token using Superdesk/Eve parsing rules."""
    auth = getattr(request, "authorization", None)
    if hasattr(auth, "username"):
        return auth.username

    token = request.headers.get("Authorization")
    if not token:
        return None

    token = token.strip()
    if token.lower().startswith(("token ", "bearer ")):
        return token.split(" ", 1)[1]

    return token


def hydrate_request_context_from_token(token, method=None, touch_session=True):
    """Populate flask.g auth context from an auth token.

    Returns the resolved user dict or None if the token is invalid.
    """
    if not token:
        return None

    existing_auth = flask.g.get("auth")
    existing_user = get_authenticated_user_from_context()

    if (
        existing_auth
        and isinstance(existing_user, dict)
        and existing_auth.get("token") == token
    ):
        auth_service = get_resource_service("auth")
        if touch_session and method:
            _touch_auth_session(auth_service, existing_auth, method)
        return existing_user

    auth_service = get_resource_service("auth")
    auth_token = auth_service.find_one(token=token, req=None)
    if not auth_token:
        return None

    user_service = get_resource_service("users")
    user_id = str(auth_token["user"])
    user = user_service.find_one(req=None, _id=user_id)
    if not user:
        return None

    flask.g.user = user
    flask.g.role = user_service.get_role(user)
    flask.g.auth = auth_token
    flask.g.auth_value = auth_token["user"]

    if touch_session and method:
        _touch_auth_session(auth_service, auth_token, method)

    return user


class LiveBlogTokenAuth(SuperdeskTokenAuth):
    """
    Token authentication for LiveBlog.

    Uses the system-level users service (no tenant filtering) to look up
    users during authentication. This is necessary because authentication
    happens before tenant context exists (before flask.g.user is set).
    """

    def check_auth(self, token, allowed_roles, resource, method):
        """
        Validate auth token and set request context.

        Uses the system users service which has no tenant filtering,
        allowing authentication to work before tenant context is established.

        Args:
            token: Authentication token
            allowed_roles: Allowed roles for resource
            resource: Resource being accessed
            method: HTTP method

        Returns:
            bool: True if authorized, raises exception otherwise
        """
        user = hydrate_request_context_from_token(
            token, method=method, touch_session=True
        )
        if user:
            return self.check_permissions(resource, method, user)
