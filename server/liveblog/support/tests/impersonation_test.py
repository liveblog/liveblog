"""
Tests for the support tenant impersonation endpoints.

Covers the self-gating of all /api/support/* endpoints, the tenants and
tenant users listings, the impersonation validations, the session created
for the target user, and the idempotent stop endpoint.
"""

import json

import flask
import superdesk
from bson import ObjectId
from apps.auth.service import AuthService

from superdesk.tests import TestCase
from superdesk.utc import utcnow

from liveblog import tenants
from liveblog.common import run_once
from liveblog.auth import is_support_user, LiveBlogAuthResource
from liveblog.auth.token_auth import LiveBlogTokenAuth
from liveblog.tenancy import get_tenant_id
from liveblog.support.impersonation import support_blueprint, TENANT_USER_FIELDS

SUPPORT_TOKEN = "support-token"
ADMIN_TOKEN = "admin-token"


class SupportImpersonationTestCase(TestCase):
    @run_once
    def setup_test_case(self):
        tenants.init_app(self.app)
        # Mirror liveblog.auth.init_app: the extended resource keeps
        # `impersonated_by` in the auth endpoint projection
        service = AuthService("auth", backend=superdesk.get_backend())
        LiveBlogAuthResource("auth", app=self.app, service=service)
        self.app.register_blueprint(support_blueprint)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        self.client = self.app.test_client()

        self.support_id = ObjectId()
        self.owner_id = ObjectId()
        self.member_id = ObjectId()
        self.inactive_id = ObjectId()
        self.disabled_id = ObjectId()
        self.pending_id = ObjectId()
        self.no_tenant_id = ObjectId()
        self.tenant_a_id = ObjectId()
        self.tenant_b_id = ObjectId()

        self.app.data.insert(
            "tenants",
            [
                {
                    "_id": self.tenant_a_id,
                    "name": "Alpha",
                    "organization_name": "Alpha Org",
                    "subscription_level": "solo",
                    "owner_user_id": self.owner_id,
                    "_created": utcnow(),
                },
                {
                    "_id": self.tenant_b_id,
                    "name": "Beta",
                    "organization_name": None,
                    "subscription_level": "team",
                    "owner_user_id": None,
                    "_created": utcnow(),
                },
            ],
        )

        active_user = {
            "is_active": True,
            "is_enabled": True,
            "needs_activation": False,
        }
        self.app.data.insert(
            "users",
            [
                dict(
                    _id=self.support_id,
                    username="support",
                    email="support@example.com",
                    display_name="Support User",
                    user_type="administrator",
                    is_support=True,
                    **active_user,
                ),
                dict(
                    _id=self.owner_id,
                    username="owner",
                    email="owner@example.com",
                    display_name="Alpha Owner",
                    user_type="administrator",
                    tenant_id=self.tenant_a_id,
                    password="secret-hash",
                    **active_user,
                ),
                dict(
                    _id=self.member_id,
                    username="member",
                    email="member@example.com",
                    display_name="Alpha Member",
                    user_type="user",
                    tenant_id=self.tenant_a_id,
                    **active_user,
                ),
                dict(
                    _id=self.inactive_id,
                    username="inactive",
                    email="inactive@example.com",
                    display_name="Alpha Inactive",
                    user_type="user",
                    tenant_id=self.tenant_a_id,
                    is_active=False,
                    is_enabled=False,
                    needs_activation=False,
                ),
                dict(
                    _id=self.disabled_id,
                    username="disabled",
                    email="disabled@example.com",
                    display_name="Alpha Disabled",
                    user_type="user",
                    tenant_id=self.tenant_a_id,
                    is_active=True,
                    is_enabled=False,
                    needs_activation=False,
                ),
                dict(
                    _id=self.pending_id,
                    username="pending",
                    email="pending@example.com",
                    display_name="Alpha Pending",
                    user_type="user",
                    tenant_id=self.tenant_a_id,
                    is_active=True,
                    is_enabled=True,
                    needs_activation=True,
                ),
                dict(
                    _id=self.no_tenant_id,
                    username="notenant",
                    email="notenant@example.com",
                    display_name="No Tenant",
                    user_type="user",
                    **active_user,
                ),
            ],
        )

        now = utcnow()
        self.app.data.insert(
            "auth",
            [
                {
                    "user": self.support_id,
                    "token": SUPPORT_TOKEN,
                    "_created": now,
                    "_updated": now,
                },
                {
                    "user": self.owner_id,
                    "token": ADMIN_TOKEN,
                    "_created": now,
                    "_updated": now,
                },
            ],
        )

    def get(self, url, token=None):
        headers = {"Authorization": token} if token else {}
        return self.client.get(url, headers=headers)

    def post(self, url, token=None, data=None):
        headers = {"Authorization": token} if token else {}
        return self.client.post(
            url,
            headers=headers,
            data=json.dumps(data or {}),
            content_type="application/json",
        )

    def impersonate(self, user_id, token=SUPPORT_TOKEN):
        return self.post(
            "/api/support/impersonate", token=token, data={"user_id": str(user_id)}
        )

    def parse(self, response):
        return json.loads(response.get_data())

    def test_is_support_user_helper(self):
        self.assertTrue(is_support_user({"is_support": True}))
        self.assertFalse(is_support_user({"is_support": False}))
        self.assertFalse(is_support_user({}))
        self.assertFalse(is_support_user())
        flask.g.user = {"is_support": True}
        self.assertTrue(is_support_user())
        del flask.g.user

    def test_endpoints_reject_anonymous(self):
        urls = [
            ("GET", "/api/support/tenants"),
            ("GET", "/api/support/tenants/{}/users".format(self.tenant_a_id)),
            ("POST", "/api/support/impersonate"),
        ]
        for method, url in urls:
            response = self.get(url) if method == "GET" else self.post(url)
            self.assertEqual(response.status_code, 403, url)

    def test_endpoints_reject_non_support(self):
        urls = [
            ("GET", "/api/support/tenants"),
            ("GET", "/api/support/tenants/{}/users".format(self.tenant_a_id)),
            ("POST", "/api/support/impersonate"),
        ]
        for method, url in urls:
            response = (
                self.get(url, token=ADMIN_TOKEN)
                if method == "GET"
                else self.post(url, token=ADMIN_TOKEN)
            )
            self.assertEqual(response.status_code, 403, url)

    def test_tenants_list_with_owner_join(self):
        response = self.get("/api/support/tenants", token=SUPPORT_TOKEN)
        self.assertEqual(response.status_code, 200)

        tenants_list = self.parse(response)["tenants"]
        self.assertEqual(len(tenants_list), 2)
        self.assertEqual([t["name"] for t in tenants_list], ["Alpha", "Beta"])

        alpha, beta = tenants_list
        self.assertEqual(alpha["organization_name"], "Alpha Org")
        self.assertEqual(alpha["subscription_level"], "solo")
        self.assertEqual(
            alpha["owner"],
            {
                "_id": str(self.owner_id),
                "display_name": "Alpha Owner",
                "email": "owner@example.com",
            },
        )
        self.assertIsNone(beta["owner"])

    def test_tenant_users_whitelist_and_is_owner(self):
        response = self.get(
            "/api/support/tenants/{}/users".format(self.tenant_a_id),
            token=SUPPORT_TOKEN,
        )
        self.assertEqual(response.status_code, 200)

        users = self.parse(response)["users"]
        self.assertEqual(len(users), 5)

        expected_fields = set(TENANT_USER_FIELDS) | {"is_owner"}
        for user in users:
            self.assertEqual(set(user.keys()), expected_fields)
            self.assertNotIn("password", user)

        by_id = {user["_id"]: user for user in users}
        self.assertNotIn(str(self.support_id), by_id)
        self.assertTrue(by_id[str(self.owner_id)]["is_owner"])
        self.assertFalse(by_id[str(self.member_id)]["is_owner"])

    def test_tenant_users_unknown_tenant(self):
        response = self.get(
            "/api/support/tenants/{}/users".format(ObjectId()), token=SUPPORT_TOKEN
        )
        self.assertEqual(response.status_code, 404)

        response = self.get("/api/support/tenants/not-an-id/users", token=SUPPORT_TOKEN)
        self.assertEqual(response.status_code, 404)

    def test_impersonate_happy_path(self):
        response = self.impersonate(self.member_id)
        self.assertEqual(response.status_code, 200)
        payload = self.parse(response)

        session = payload["session"]
        self.assertEqual(session["user"], str(self.member_id))
        self.assertIn("token", session)
        self.assertIn("self", session["_links"])

        identity = payload["identity"]
        self.assertEqual(identity["_id"], str(self.member_id))
        self.assertEqual(identity["display_name"], "Alpha Member")
        self.assertNotIn("password", identity)

        self.assertEqual(
            payload["tenant"], {"_id": str(self.tenant_a_id), "name": "Alpha"}
        )

        auth_doc = self.app.data.find_one("auth", req=None, token=session["token"])
        self.assertIsNotNone(auth_doc)
        self.assertEqual(auth_doc["user"], self.member_id)
        self.assertEqual(auth_doc["impersonated_by"], self.support_id)

    def test_impersonation_token_authenticates_as_target(self):
        response = self.impersonate(self.member_id)
        token = self.parse(response)["session"]["token"]

        auth = LiveBlogTokenAuth()
        with self.app.test_request_context("/api"):
            self.assertTrue(auth.check_auth(token, None, "blogs", "GET"))
            self.assertEqual(flask.g.user["_id"], self.member_id)
            self.assertEqual(get_tenant_id(), self.tenant_a_id)

    def test_impersonate_requires_user_id(self):
        response = self.post("/api/support/impersonate", token=SUPPORT_TOKEN, data={})
        self.assertEqual(response.status_code, 400)

    def test_impersonate_unknown_user(self):
        self.assertEqual(self.impersonate(ObjectId()).status_code, 404)
        self.assertEqual(self.impersonate("not-an-id").status_code, 404)

    def test_impersonate_rejects_support_target(self):
        self.assertEqual(self.impersonate(self.support_id).status_code, 400)

    def test_impersonate_rejects_user_without_tenant(self):
        self.assertEqual(self.impersonate(self.no_tenant_id).status_code, 400)

    def test_impersonate_rejects_inactive_user(self):
        self.assertEqual(self.impersonate(self.inactive_id).status_code, 400)

    def test_impersonate_rejects_disabled_user(self):
        self.assertEqual(self.impersonate(self.disabled_id).status_code, 400)

    def test_impersonate_rejects_unactivated_user(self):
        self.assertEqual(self.impersonate(self.pending_id).status_code, 400)

    def test_impersonate_rejects_chaining(self):
        # An impersonation token belongs to a non-support user, so a chaining
        # attempt with it fails the support gate
        response = self.impersonate(self.member_id)
        token = self.parse(response)["session"]["token"]
        self.assertEqual(self.impersonate(self.owner_id, token=token).status_code, 403)

        # Even a support user session stamped with impersonated_by is rejected
        now = utcnow()
        self.app.data.insert(
            "auth",
            [
                {
                    "user": self.support_id,
                    "token": "chained-token",
                    "impersonated_by": ObjectId(),
                    "_created": now,
                    "_updated": now,
                }
            ],
        )
        response = self.impersonate(self.owner_id, token="chained-token")
        self.assertEqual(response.status_code, 403)

    def test_stop_deletes_session_and_is_idempotent(self):
        response = self.impersonate(self.member_id)
        token = self.parse(response)["session"]["token"]

        response = self.post("/api/support/impersonate/stop", token=token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.parse(response), {"stopped": True})
        self.assertIsNone(self.app.data.find_one("auth", req=None, token=token))

        # Second stop with the deleted token stays idempotent
        response = self.post("/api/support/impersonate/stop", token=token)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.parse(response), {"stopped": True})

    def test_stop_without_session_is_idempotent(self):
        response = self.post("/api/support/impersonate/stop")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.parse(response), {"stopped": True})

    def test_stop_rejects_regular_session(self):
        response = self.post("/api/support/impersonate/stop", token=SUPPORT_TOKEN)
        self.assertEqual(response.status_code, 400)
        self.assertIsNotNone(
            self.app.data.find_one("auth", req=None, token=SUPPORT_TOKEN)
        )
