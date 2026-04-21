import json
import uuid
from base64 import b64encode
from unittest import TestCase
from unittest.mock import patch

import flask
from bson import ObjectId

from superdesk.errors import SuperdeskApiError
from superdesk.tests import TestCase as SuperdeskTestCase
from superdesk import get_resource_service
from superdesk.utc import utcnow

from liveblog import auth, billing, items, tenants, users
from liveblog.billing import _check_billing_gate
from liveblog.common import run_once
from liveblog.items.items import drag_and_drop_blueprint
from liveblog.tenancy.registration import RegistrationService


class BillingGateUnitTest(TestCase):
    def test_blocks_mutating_request_for_unpaid_tenant(self):
        app = flask.Flask(__name__)
        app.config["STRIPE_BILLING_REQUIRED"] = True

        with app.test_request_context("/api/archive", method="POST"):
            flask.g.user = {"tenant_id": ObjectId()}

            with patch("liveblog.tenancy.get_tenant") as mock_get_tenant, patch(
                "liveblog.billing.service.get_billing_state"
            ) as mock_get_billing_state:
                mock_get_tenant.return_value = {"_id": ObjectId()}
                mock_get_billing_state.return_value = {
                    "access_allowed": False,
                    "redirect": "pricing",
                    "status": "canceled",
                }

                with self.assertRaises(SuperdeskApiError) as context:
                    _check_billing_gate()

        self.assertEqual(context.exception.status_code, 403)

    def test_exempt_routes_are_not_blocked(self):
        app = flask.Flask(__name__)
        app.config["STRIPE_BILLING_REQUIRED"] = True

        with app.test_request_context("/api/register", method="POST"):
            flask.g.user = {"tenant_id": ObjectId()}

            with patch("liveblog.tenancy.get_tenant") as mock_get_tenant:
                _check_billing_gate()

        mock_get_tenant.assert_not_called()


class BillingIntegrationTestCase(SuperdeskTestCase):
    @run_once
    def setup_test_case(self):
        self.app.config.update(
            {
                "LIVEBLOG_DEBUG": True,
                "DEBUG": False,
                "STRIPE_BILLING_REQUIRED": True,
                "STRIPE_SECRET_KEY": "sk_test_123",
                "STRIPE_PRICING_URL": "https://example.com/pricing",
            }
        )

        for lb_app in [tenants, users, auth, items, billing]:
            lb_app.init_app(self.app)

        if "drag_and_drop" not in self.app.blueprints:
            self.app.register_blueprint(drag_and_drop_blueprint)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        self.client = self.app.test_client()

    def _create_auth_headers(self, user_id):
        token = "test-token-" + str(ObjectId())
        self.app.data.insert(
            "auth", [{"user": user_id, "token": token, "_updated": utcnow()}]
        )
        return {
            "Authorization": "basic "
            + b64encode((token + ":").encode("ascii")).decode("ascii"),
            "Content-Type": "application/json",
        }

    def _create_user_with_tenant(self, tenant_updates=None):
        tenant_doc = {"name": "Billing Tenant"}
        if tenant_updates:
            tenant_doc.update(tenant_updates)

        tenant_id = ObjectId(get_resource_service("tenants").post([tenant_doc])[0])
        user_id = ObjectId(
            get_resource_service("users").post(
                [
                    {
                        "username": "billing_" + uuid.uuid4().hex[:8],
                        "email": "billing_" + uuid.uuid4().hex[:8] + "@example.com",
                        "password": "securepass123",
                        "first_name": "Billing",
                        "last_name": "User",
                        "tenant_id": tenant_id,
                        "user_type": "administrator",
                    }
                ]
            )[0]
        )
        return tenant_id, user_id

    def test_non_eve_write_is_blocked_when_billing_access_is_denied(self):
        tenant_id, user_id = self._create_user_with_tenant()
        headers = self._create_auth_headers(user_id)

        response = self.client.post(
            "/api/archive/draganddrop/",
            data=json.dumps(
                {"image_url": "data:image/png;base64,AAAA", "mimetype": "image/png"}
            ),
            headers=headers,
        )

        self.assertEqual(response.status_code, 403)
        self.assertIn("SUBSCRIPTION_REQUIRED", response.get_data(as_text=True))

        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertIsNone(tenant.get("stripe_customer_id"))

    def test_billing_endpoint_creates_missing_stripe_customer_lazily(self):
        registration_service = RegistrationService()
        unique_id = uuid.uuid4().hex[:8]
        registration_data = {
            "username": f"lazybilling_{unique_id}",
            "email": f"lazybilling_{unique_id}@example.com",
            "password": "securepass123",
            "first_name": "Lazy",
            "last_name": "Billing",
        }

        with patch.object(
            registration_service, "_get_stripe_key", return_value="sk_test_registration"
        ), patch.object(
            registration_service, "_create_stripe_customer", return_value=None
        ):
            result = registration_service.register_new_user(registration_data)

        tenant = get_resource_service("tenants").find_one(
            req=None, _id=result["tenant_id"]
        )
        self.assertIsNone(tenant.get("stripe_customer_id"))

        headers = self._create_auth_headers(ObjectId(result["user_id"]))

        with patch("liveblog.billing.service.stripe") as mock_service_stripe, patch(
            "liveblog.billing.endpoints.stripe"
        ) as mock_endpoint_stripe:
            mock_service_stripe.Customer.create.return_value = type(
                "Customer", (), {"id": "cus_lazy_123"}
            )()
            mock_endpoint_stripe.billing_portal.Session.create.return_value = type(
                "PortalSession", (), {"url": "https://stripe.example.test/portal"}
            )()

            response = self.client.post(
                "/api/billing/portal",
                data=json.dumps({"return_url": "https://app.example.test"}),
                headers=headers,
            )

        self.assertEqual(response.status_code, 200)
        tenant = get_resource_service("tenants").find_one(
            req=None, _id=result["tenant_id"]
        )
        self.assertEqual(tenant.get("stripe_customer_id"), "cus_lazy_123")
