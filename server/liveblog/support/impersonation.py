"""
Tenant impersonation endpoints for support users.

All endpoints hydrate the request context from the auth token (blueprints
bypass the Eve auth layer) and self-gate on `is_support_user()`. Self-gating
also covers GET requests because core `check_permissions` waves GETs through.

Impersonation creates a real session in the auth collection for the target
user, stamped with `impersonated_by` for auditing. Tenant isolation then
works untouched since every subsequent request authenticates as the target.
"""

import logging
import re
from functools import wraps

import flask
from bson import ObjectId
from bson.errors import InvalidId
from flask import Blueprint, request
from flask_cors import CORS

from superdesk import get_resource_service
from superdesk.utils import get_random_string
from liveblog.auth.token_auth import (
    is_support_user,
    get_request_auth_token,
    hydrate_request_context_from_token,
)
from liveblog.utils.api import api_response, api_error

logger = logging.getLogger(__name__)
support_blueprint = Blueprint("support", __name__)
CORS(support_blueprint)

TENANT_FIELDS = ("_id", "name", "organization_name", "subscription_level", "_created")
OWNER_FIELDS = ("_id", "display_name", "email")
TENANT_USER_FIELDS = (
    "_id",
    "display_name",
    "email",
    "username",
    "user_type",
    "role",
    "is_active",
    "needs_activation",
)
IDENTITY_FIELDS = (
    "_id",
    "username",
    "email",
    "display_name",
    "first_name",
    "last_name",
    "user_type",
    "role",
    "is_active",
    "is_enabled",
    "needs_activation",
    "tenant_id",
    "byline",
    "sign_off",
    "language",
    "picture_url",
    "_created",
    "_updated",
)


def _pick(doc, fields):
    return {field: doc.get(field) for field in fields}


def _billing_state(tenant):
    # Local import: liveblog.billing pulls in settings and Stripe at import
    # time, so a top-level import here risks a cycle during app setup.
    from liveblog.billing.service import get_billing_state

    return get_billing_state(tenant)


def _count_tenant_blogs(tenant_oid):
    """Count a tenant's blogs directly against MongoDB.

    The blogs service is a TenantAwareService that injects the *caller's*
    tenant into every lookup. In a support request the caller is not the
    target tenant, so counting through the service would filter by the wrong
    tenant (or raise when the support user has no tenant). Querying pymongo
    with an explicit tenant_id filter bypasses that injection entirely.
    """
    collection = flask.current_app.data.mongo.pymongo(resource="blogs").db["blogs"]
    return collection.count_documents({"tenant_id": tenant_oid})


def _hydrate_current_user():
    """Resolve the requesting user from the auth token.

    Always resolves from the token (the helper reuses an already hydrated
    context only when its token matches), so a stale flask.g.user can never
    leak into the support gate.
    """
    return hydrate_request_context_from_token(
        get_request_auth_token(), touch_session=False
    )


def support_user_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user = _hydrate_current_user()
        if not is_support_user(user):
            return api_error("Support permissions required", 403)
        return fn(*args, **kwargs)

    return wrapper


def _tenant_ids_with_matching_user(term):
    """Tenant ids that have at least one user matching the search term.

    Matches on display_name, username or email so support can find a tenant
    by any of its members, not only its owner.
    """
    pattern = {"$regex": re.escape(term), "$options": "i"}
    users = get_resource_service("users").get_from_mongo(
        req=None,
        lookup={
            "$or": [
                {"display_name": pattern},
                {"username": pattern},
                {"email": pattern},
            ]
        },
    )
    return {user["tenant_id"] for user in users if user.get("tenant_id")}


@support_blueprint.route("/api/support/tenants", methods=["GET"])
@support_user_required
def get_tenants():
    """List tenants with their owner joined in, optionally filtered by ?q.

    The q term matches tenant name, organization, owner email, and any of a
    tenant's users (name, username, email).
    """
    tenants = list(get_resource_service("tenants").get_from_mongo(req=None, lookup={}))

    # The support user's own tenant (the internal support workspace) is not a
    # customer to debug, and its users must not be impersonated, so it is
    # never listed.
    own_tenant_id = flask.g.user.get("tenant_id")
    if own_tenant_id:
        tenants = [tenant for tenant in tenants if tenant["_id"] != own_tenant_id]

    owner_ids = [
        tenant["owner_user_id"] for tenant in tenants if tenant.get("owner_user_id")
    ]
    owners = {}
    if owner_ids:
        users = get_resource_service("users").get_from_mongo(
            req=None, lookup={"_id": {"$in": owner_ids}}
        )
        owners = {user["_id"]: user for user in users}

    term = (request.args.get("q") or "").strip()
    if term:
        needle = term.lower()
        tenant_ids_with_user = _tenant_ids_with_matching_user(term)

        def matches(tenant):
            owner = owners.get(tenant.get("owner_user_id"))
            fields = [
                tenant.get("name"),
                tenant.get("organization_name"),
                owner.get("email") if owner else None,
            ]
            if any(value and needle in value.lower() for value in fields):
                return True
            return tenant["_id"] in tenant_ids_with_user

        tenants = [tenant for tenant in tenants if matches(tenant)]

    items = []
    for tenant in sorted(tenants, key=lambda t: (t.get("name") or "").lower()):
        item = _pick(tenant, TENANT_FIELDS)
        owner = owners.get(tenant.get("owner_user_id"))
        item["owner"] = _pick(owner, OWNER_FIELDS) if owner else None
        state = _billing_state(tenant)
        item["billing_status"] = state["status"]
        item["access_allowed"] = state["access_allowed"]
        items.append(item)

    return api_response({"tenants": items}, 200)


@support_blueprint.route("/api/support/tenants/<tenant_id>", methods=["GET"])
@support_user_required
def get_tenant_detail(tenant_id):
    """Master-detail payload for a single tenant: owner, billing and counts.

    Applies the same own-tenant rule as impersonate: the support user's own
    (internal) tenant is never a customer to inspect, so it 404s just like an
    unknown id.
    """
    try:
        tenant_oid = ObjectId(tenant_id)
    except InvalidId:
        return api_error("Tenant not found", 404)

    own_tenant_id = flask.g.user.get("tenant_id")
    if own_tenant_id and tenant_oid == own_tenant_id:
        return api_error("Tenant not found", 404)

    tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_oid)
    if not tenant:
        return api_error("Tenant not found", 404)

    owner = None
    owner_id = tenant.get("owner_user_id")
    if owner_id:
        owner_doc = get_resource_service("users").find_one(req=None, _id=owner_id)
        if owner_doc:
            owner = _pick(owner_doc, OWNER_FIELDS)

    tenant_item = _pick(tenant, TENANT_FIELDS)
    tenant_item["owner"] = owner

    state = _billing_state(tenant)

    users = list(
        get_resource_service("users").get_from_mongo(
            req=None, lookup={"tenant_id": tenant_oid}
        )
    )

    return api_response(
        {
            "tenant": tenant_item,
            "billing": {
                "status": state["status"],
                "access_allowed": state["access_allowed"],
                "plan_expires_at": state["plan_expires_at"],
                "stripe_customer_id": tenant.get("stripe_customer_id"),
            },
            "stats": {
                "blogs_count": _count_tenant_blogs(tenant_oid),
                "users_count": len(users),
            },
        },
        200,
    )


@support_blueprint.route("/api/support/tenants/<tenant_id>/users", methods=["GET"])
@support_user_required
def get_tenant_users(tenant_id):
    """List the users belonging to a tenant, whitelisted fields only."""
    try:
        tenant_oid = ObjectId(tenant_id)
    except InvalidId:
        return api_error("Tenant not found", 404)

    tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_oid)
    if not tenant:
        return api_error("Tenant not found", 404)

    users = get_resource_service("users").get_from_mongo(
        req=None, lookup={"tenant_id": tenant_oid}
    )
    owner_id = tenant.get("owner_user_id")

    items = []
    for user in users:
        item = _pick(user, TENANT_USER_FIELDS)
        item["is_owner"] = bool(owner_id) and user["_id"] == owner_id
        items.append(item)

    return api_response({"users": items}, 200)


@support_blueprint.route("/api/support/impersonate", methods=["POST"])
@support_user_required
def impersonate():
    """Create a session for the target user, stamped with the support user id."""
    current_session = flask.g.get("auth") or {}
    if current_session.get("impersonated_by"):
        return api_error("Cannot impersonate from an impersonation session", 403)

    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    if not user_id:
        return api_error("user_id is required", 400)

    try:
        target_oid = ObjectId(user_id)
    except InvalidId:
        return api_error("User not found", 404)

    target = get_resource_service("users").find_one(req=None, _id=target_oid)
    if not target:
        return api_error("User not found", 404)

    if is_support_user(target):
        return api_error("Cannot impersonate a support user", 400)

    if not target.get("tenant_id"):
        return api_error("Cannot impersonate a user without a tenant", 400)

    own_tenant_id = flask.g.user.get("tenant_id")
    if own_tenant_id and target.get("tenant_id") == own_tenant_id:
        return api_error("Cannot impersonate a user in your own tenant", 400)

    if (
        not target.get("is_active", False)
        or target.get("needs_activation", False)
        or not target.get("is_enabled", True)
    ):
        return api_error("Cannot impersonate an inactive or disabled user", 400)

    tenant = get_resource_service("tenants").find_one(req=None, _id=target["tenant_id"])
    if not tenant:
        return api_error("Tenant of the target user not found", 400)

    support_user = flask.g.user
    session_doc = {
        "user": target["_id"],
        "token": get_random_string(40),
        "impersonated_by": support_user["_id"],
    }
    auth_service = get_resource_service("auth")
    # Bypass AuthService.on_create on purpose: it runs credentials
    # authentication, which does not apply here. on_created still runs so
    # the session gets session-based preferences like a login session.
    auth_service.create([session_doc])
    auth_service.on_created([session_doc])

    logger.info(
        "Impersonation started: support user %s (%s) impersonating user %s (%s) "
        "on tenant %s (%s), session %s",
        support_user["_id"],
        support_user.get("email"),
        target["_id"],
        target.get("email"),
        tenant["_id"],
        tenant.get("name"),
        session_doc["_id"],
    )

    return api_response(
        {
            "session": {
                "_id": session_doc["_id"],
                "token": session_doc["token"],
                "user": session_doc["user"],
                "_links": {
                    "self": {
                        "href": "auth_db/{}".format(session_doc["_id"]),
                        "title": "AuthResource",
                    }
                },
            },
            "identity": _pick(target, IDENTITY_FIELDS),
            "tenant": {"_id": tenant["_id"], "name": tenant.get("name")},
        },
        200,
    )


@support_blueprint.route("/api/support/impersonate/stop", methods=["POST"])
def impersonate_stop():
    """Delete the calling impersonation session. Idempotent when already gone."""
    user = _hydrate_current_user()
    session = flask.g.get("auth") if user else None

    if not session:
        # Session expired or already deleted: stopping stays idempotent so
        # the client can always restore the stashed support session.
        return api_response({"stopped": True}, 200)

    if not session.get("impersonated_by"):
        return api_error("Current session is not an impersonation session", 400)

    get_resource_service("auth").delete_action({"_id": session["_id"]})

    logger.info(
        "Impersonation stopped: user %s (%s), session %s created by support user %s",
        user["_id"],
        user.get("email"),
        session["_id"],
        session["impersonated_by"],
    )
    return api_response({"stopped": True}, 200)
