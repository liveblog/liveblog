"""
Tests for webhook event handlers.
"""
from unittest import TestCase
from unittest.mock import patch, MagicMock
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

    @patch("liveblog.billing.service.get_resource_service")
    def test_subscription_created_updates_tenant(self, mock_grs):
        mock_service = MagicMock()
        mock_service.find_one.return_value = {
            "_id": "tenant_1",
            "stripe_customer_id": "cus_123",
        }
        mock_grs.return_value = mock_service

        event = self._make_event(level="team", status="active")

        _handle_subscription_event(event)

        mock_service.patch.assert_called_once()
        call_args = mock_service.patch.call_args
        updates = call_args[0][1]

        self.assertEqual(updates["subscription_level"], "team")
        self.assertEqual(updates["stripe_subscription_id"], "sub_456")
        self.assertEqual(updates["stripe_subscription_status"], "active")

    @patch("liveblog.billing.service.get_resource_service")
    def test_subscription_event_no_tenant_found(self, mock_grs):
        mock_service = MagicMock()
        mock_service.find_one.return_value = None
        mock_grs.return_value = mock_service

        event = self._make_event()

        _handle_subscription_event(event)

        mock_service.patch.assert_not_called()

    def test_subscription_event_no_customer_id(self):
        event = {"data": {"object": {"id": "sub_1"}}}

        _handle_subscription_event(event)

    @patch("liveblog.billing.service.get_resource_service")
    def test_subscription_deleted_resets_to_solo(self, mock_grs):
        mock_service = MagicMock()
        mock_service.find_one.return_value = {
            "_id": "tenant_1",
            "stripe_customer_id": "cus_123",
        }
        mock_grs.return_value = mock_service

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

        mock_service.patch.assert_called_once()
        call_args = mock_service.patch.call_args
        updates = call_args[0][1]

        self.assertEqual(updates["subscription_level"], "solo")
        self.assertIsNone(updates["stripe_subscription_id"])
        self.assertEqual(updates["stripe_subscription_status"], "canceled")

    @patch("liveblog.billing.service.get_resource_service")
    def test_deleted_no_tenant_found(self, mock_grs):
        mock_service = MagicMock()
        mock_service.find_one.return_value = None
        mock_grs.return_value = mock_service

        event = {
            "data": {
                "object": {
                    "id": "sub_456",
                    "customer": "cus_unknown",
                },
            },
        }

        _handle_subscription_deleted(event)

        mock_service.patch.assert_not_called()

    def test_deleted_no_customer_id(self):
        event = {"data": {"object": {"id": "sub_1"}}}

        _handle_subscription_deleted(event)
