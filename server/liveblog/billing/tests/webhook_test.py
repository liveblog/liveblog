"""
Tests for webhook event handlers.
"""
from unittest import TestCase
from unittest.mock import patch
from bson import ObjectId
from liveblog.billing.webhooks import (
    _handle_subscription_event,
    _handle_subscription_deleted,
)


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
