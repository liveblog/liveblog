"""
Hardening tests for the REST users surface.

Covers the internal flip of /api/users, the is_support escalation closure on
/api/liveblog_users (POST and PATCH), and tenant_id spoofing protection on
create and update.
"""

import os
import json
import subprocess
import sys
from base64 import b64encode

import flask
from bson import ObjectId

from superdesk import get_resource_service
from superdesk.tests import TestCase
from superdesk.utc import utcnow

from liveblog import tenants
from liveblog import users as users_app
from liveblog import liveblog_users as liveblog_users_app
from liveblog.common import run_once
from liveblog.support.impersonation import support_blueprint

ADMIN_TOKEN = "escalation-admin-token"

SERVER_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


class UsersPrivilegeEscalationTestCase(TestCase):
    @run_once
    def setup_test_case(self):
        tenants.init_app(self.app)
        users_app.init_app(self.app)
        liveblog_users_app.init_app(self.app)
        if "support" not in self.app.blueprints:
            self.app.register_blueprint(support_blueprint)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        # The billing gate tests leave STRIPE_BILLING_REQUIRED enabled on the
        # shared test app; billing enforcement is not under test here
        self.app.config["STRIPE_BILLING_REQUIRED"] = False
        self.client = self.app.test_client()

        self.tenant_a_id = ObjectId()
        self.tenant_b_id = ObjectId()
        self.admin_id = ObjectId()

        self.app.data.insert(
            "tenants",
            [
                {"_id": self.tenant_a_id, "name": "Alpha"},
                {"_id": self.tenant_b_id, "name": "Beta"},
            ],
        )
        self.app.data.insert(
            "users",
            [
                {
                    "_id": self.admin_id,
                    "username": "tenantadmin",
                    "email": "tenantadmin@example.com",
                    "display_name": "Tenant Admin",
                    "user_type": "administrator",
                    "tenant_id": self.tenant_a_id,
                    "is_active": True,
                    "is_enabled": True,
                    "needs_activation": False,
                }
            ],
        )
        now = utcnow()
        self.app.data.insert(
            "auth",
            [
                {
                    "user": self.admin_id,
                    "token": ADMIN_TOKEN,
                    "_created": now,
                    "_updated": now,
                }
            ],
        )

    def auth_header(self, token):
        encoded = b64encode("{}:".format(token).encode()).decode()
        return {"Authorization": "basic {}".format(encoded)}

    def post_user(self, payload, token=ADMIN_TOKEN):
        return self.client.post(
            "/api/liveblog_users",
            headers=self.auth_header(token),
            data=json.dumps(payload),
            content_type="application/json",
        )

    def patch_user(self, user_id, etag, payload, token=ADMIN_TOKEN):
        headers = self.auth_header(token)
        headers["If-Match"] = etag
        return self.client.patch(
            "/api/liveblog_users/{}".format(user_id),
            headers=headers,
            data=json.dumps(payload),
            content_type="application/json",
        )

    def create_user(self, username="regular"):
        response = self.post_user(
            {
                "username": username,
                "email": "{}@example.com".format(username),
                "display_name": "Regular User",
            }
        )
        self.assertEqual(response.status_code, 201)
        return json.loads(response.get_data())

    def stored_user(self, username):
        return get_resource_service("users").find_one(req=None, username=username)

    def test_users_rest_routes_are_gone_in_real_app(self):
        """The real app factory registers users as internal: no REST routes."""
        script = "; ".join(
            [
                "from app import get_app",
                "app = get_app({"
                "'MONGO_DBNAME': 'sptests', "
                "'MONGO_URI': 'mongodb://localhost/sptests', "
                "'ELASTICSEARCH_INDEX': 'sptest', "
                "'SUPERDESK_TESTING': True})",
                "client = app.test_client()",
                "assert app.config['DOMAIN']['users']['internal_resource'] is True",
                "assert client.get('/api/users').status_code == 404",
                "assert client.get('/api/users/507f1f77bcf86cd799439011')"
                ".status_code == 404",
                "assert any(rule.rule == '/api/liveblog_users' "
                "for rule in app.url_map.iter_rules())",
            ]
        )
        # Run in a subprocess: booting the real app in-process would rebind
        # the global service registry used by the shared test app
        result = subprocess.run(
            [sys.executable, "-c", script],
            cwd=SERVER_DIR,
            env=dict(os.environ, SUPERDESK_TESTING="true"),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        self.assertEqual(
            result.returncode, 0, result.stderr.decode(errors="replace")[-2000:]
        )

    def test_post_cannot_set_is_support(self):
        response = self.post_user(
            {
                "username": "sneaky",
                "email": "sneaky@example.com",
                "display_name": "Sneaky User",
                "is_support": True,
            }
        )
        self.assertEqual(response.status_code, 201)

        stored = self.stored_user("sneaky")
        self.assertIsNotNone(stored)
        self.assertFalse(stored.get("is_support", False))
        self.assertEqual(stored["tenant_id"], self.tenant_a_id)

        # The created user gets no access to support endpoints
        now = utcnow()
        self.app.data.insert(
            "auth",
            [
                {
                    "user": stored["_id"],
                    "token": "sneaky-token",
                    "_created": now,
                    "_updated": now,
                }
            ],
        )
        response = self.client.get(
            "/api/support/tenants", headers=self.auth_header("sneaky-token")
        )
        self.assertEqual(response.status_code, 403)

    def test_post_with_spoofed_tenant_id_is_rejected(self):
        # tenant_id is not part of the REST schema, so Eve validation
        # rejects it before any document is created
        response = self.post_user(
            {
                "username": "spoofer",
                "email": "spoofer@example.com",
                "display_name": "Spoofer",
                "tenant_id": str(self.tenant_b_id),
            }
        )
        self.assertIn(response.status_code, (400, 422))
        self.assertIsNone(self.stored_user("spoofer"))

    def test_on_create_enforces_caller_tenant(self):
        """Service-level guard for resources whose schema admits tenant_id."""
        service = get_resource_service("liveblog_users")
        doc = {
            "username": "crosstenant",
            "email": "crosstenant@example.com",
            "display_name": "Cross Tenant",
            "tenant_id": self.tenant_b_id,
        }
        with self.app.test_request_context("/api"):
            flask.g.user = get_resource_service("users").find_one(
                req=None, _id=self.admin_id
            )
            service.on_create([doc])

        self.assertEqual(doc["tenant_id"], self.tenant_a_id)

    def test_patch_cannot_set_is_support(self):
        created = self.create_user("patchtarget")

        response = self.patch_user(
            created["_id"], created["_etag"], {"is_support": True}
        )
        self.assertEqual(response.status_code, 200)

        stored = self.stored_user("patchtarget")
        self.assertFalse(stored.get("is_support", False))

    def test_patch_cannot_change_tenant(self):
        created = self.create_user("tenantmove")

        response = self.patch_user(
            created["_id"], created["_etag"], {"tenant_id": str(self.tenant_b_id)}
        )
        self.assertIn(response.status_code, (400, 422))

        stored = self.stored_user("tenantmove")
        self.assertEqual(stored["tenant_id"], self.tenant_a_id)
