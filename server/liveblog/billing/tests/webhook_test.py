"""
Tests for webhook event handlers.
"""
import datetime
import json
from unittest import TestCase
from unittest.mock import patch

import stripe
from bson import ObjectId

from superdesk import get_resource_service
from superdesk.tests import TestCase as SuperdeskTestCase
from superdesk.utc import utcnow

from liveblog import billing, tenants
from liveblog.billing.webhooks import (
    _handle_subscription_event,
    _handle_subscription_deleted,
)
from liveblog.common import run_once


class WebhookHandlerTest(TestCase):
    """Test Stripe webhook event handlers."""

    def _make_event(
        self, customer_id="cus_123", status="active", sub_id="sub_456", level="solo"
    ):
        return {
            "data": {
                "object": {
                    "id": sub_id,
                    "customer": customer_id,
                    "status": status,
                    "items": {
                        "data": [
                            {
                                "price": {
                                    "product": {
                                        "metadata": {
                                            "subscription_level": level,
                                        },
                                    },
                                },
                            }
                        ],
                    },
                },
            },
        }

    @patch("liveblog.billing.webhooks.service.update_tenant_subscription")
    @patch("liveblog.billing.webhooks.service.find_tenant_by_customer")
    def test_subscription_created_updates_tenant(
        self, mock_find_tenant_by_customer, mock_update_tenant_subscription
    ):
        tenant_id = ObjectId()
        mock_find_tenant_by_customer.return_value = {
            "_id": tenant_id,
            "stripe_customer_id": "cus_123",
        }

        event = self._make_event(level="team", status="active")

        _handle_subscription_event(event)

        mock_find_tenant_by_customer.assert_called_once_with("cus_123")
        mock_update_tenant_subscription.assert_called_once_with(
            tenant_id, event["data"]["object"]
        )

    @patch("liveblog.billing.webhooks.service.update_tenant_subscription")
    @patch("liveblog.billing.webhooks.service.find_tenant_by_customer")
    def test_subscription_event_no_tenant_found(
        self, mock_find_tenant_by_customer, mock_update_tenant_subscription
    ):
        mock_find_tenant_by_customer.return_value = None

        event = self._make_event()

        _handle_subscription_event(event)

        mock_update_tenant_subscription.assert_not_called()

    def test_subscription_event_no_customer_id(self):
        event = {"data": {"object": {"id": "sub_1"}}}

        _handle_subscription_event(event)

    @patch("liveblog.billing.webhooks.service.reset_tenant_subscription")
    @patch("liveblog.billing.webhooks.service.find_tenant_by_customer")
    def test_subscription_deleted_resets_to_solo(
        self, mock_find_tenant_by_customer, mock_reset_tenant_subscription
    ):
        tenant_id = ObjectId()
        mock_find_tenant_by_customer.return_value = {
            "_id": tenant_id,
            "stripe_customer_id": "cus_123",
        }

        event = {
            "data": {
                "object": {
                    "id": "sub_456",
                    "customer": "cus_123",
                    "status": "canceled",
                },
            },
        }

        _handle_subscription_deleted(event)

        mock_find_tenant_by_customer.assert_called_once_with("cus_123")
        mock_reset_tenant_subscription.assert_called_once_with(tenant_id)

    @patch("liveblog.billing.webhooks.service.reset_tenant_subscription")
    @patch("liveblog.billing.webhooks.service.find_tenant_by_customer")
    def test_deleted_no_tenant_found(
        self, mock_find_tenant_by_customer, mock_reset_tenant_subscription
    ):
        mock_find_tenant_by_customer.return_value = None

        event = {
            "data": {
                "object": {
                    "id": "sub_456",
                    "customer": "cus_unknown",
                },
            },
        }

        _handle_subscription_deleted(event)

        mock_reset_tenant_subscription.assert_not_called()

    def test_deleted_no_customer_id(self):
        event = {"data": {"object": {"id": "sub_1"}}}

        _handle_subscription_deleted(event)


class CheckoutCompletedWebhookTest(SuperdeskTestCase):
    """Test checkout.session.completed through the webhook endpoint."""

    @run_once
    def setup_test_case(self):
        if "billing" not in self.app.blueprints:
            for lb_app in [tenants, billing]:
                lb_app.init_app(self.app)

    def setUp(self):
        super().setUp()
        self.setup_test_case()
        self.app.config.update(
            {
                "STRIPE_SECRET_KEY": "sk_test_123",
                "STRIPE_WEBHOOK_SECRET": "whsec_test_123",
            }
        )
        self.client = self.app.test_client()
        self.tenant_id = ObjectId(
            get_resource_service("tenants").post(
                [{"name": "Go Tenant", "stripe_customer_id": "cus_go_123"}]
            )[0]
        )

    def _checkout_event(self, mode="payment"):
        return {
            "id": "evt_checkout_123",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_123",
                    "mode": mode,
                    "customer": "cus_go_123",
                },
            },
        }

    def _expanded_session(self):
        return {
            "id": "cs_test_123",
            "line_items": {
                "data": [
                    {
                        "price": {
                            "id": "price_go_30",
                            "product": {
                                "metadata": {
                                    "subscription_level": "liveblog-go",
                                    "plan_duration_days": "30",
                                },
                            },
                        },
                    }
                ],
            },
        }

    def _post_event(self, event):
        with patch.object(stripe.Webhook, "construct_event", return_value=event):
            return self.client.post(
                "/api/billing/webhook",
                data=json.dumps(event),
                headers={"Stripe-Signature": "t=1,v1=test"},
            )

    def _get_tenant(self):
        return get_resource_service("tenants").find_one(req=None, _id=self.tenant_id)

    def test_payment_checkout_activates_time_limited_plan(self):
        with patch.object(
            stripe.checkout.Session,
            "retrieve",
            return_value=self._expanded_session(),
        ) as mock_retrieve:
            response = self._post_event(self._checkout_event())

        self.assertEqual(response.status_code, 200)
        mock_retrieve.assert_called_once_with(
            "cs_test_123", expand=["line_items.data.price.product"]
        )
        tenant = self._get_tenant()
        self.assertEqual(tenant["subscription_level"], "liveblog-go")
        self.assertEqual(tenant["plan_price_id"], "price_go_30")
        expected_expiry = utcnow() + datetime.timedelta(days=30)
        self.assertLess(
            abs(tenant["plan_expires_at"] - expected_expiry),
            datetime.timedelta(minutes=1),
        )

    def test_session_retrieve_failure_returns_error_so_stripe_retries(self):
        with patch.object(
            stripe.checkout.Session,
            "retrieve",
            side_effect=stripe.error.APIConnectionError("Network down"),
        ):
            response = self._post_event(self._checkout_event())

        self.assertEqual(response.status_code, 500)
        tenant = self._get_tenant()
        self.assertIsNone(tenant.get("plan_price_id"))
        self.assertIsNone(tenant.get("plan_expires_at"))

    def test_subscription_checkout_is_ignored(self):
        with patch.object(stripe.checkout.Session, "retrieve") as mock_retrieve:
            response = self._post_event(self._checkout_event(mode="subscription"))

        self.assertEqual(response.status_code, 200)
        mock_retrieve.assert_not_called()
        self.assertIsNone(self._get_tenant().get("plan_expires_at"))
