"""
Tests for billing service business logic.
"""
import flask
from unittest import TestCase
from unittest.mock import patch, MagicMock

from liveblog.billing.service import (
    get_billing_state,
    get_subscription_level,
    sync_subscription_from_stripe,
    ACTIVE_STATUSES,
    RECOVERABLE_STATUSES,
    TERMINAL_STATUSES,
)


class BillingStateTest(TestCase):
    """Test get_billing_state() subscription state resolution."""

    def test_no_tenant(self):
        state = get_billing_state(None)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "pricing")

    def test_never_subscribed(self):
        tenant = {"_id": "t1"}

        state = get_billing_state(tenant)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "pricing")

    def test_active_subscription(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "active",
        }

        state = get_billing_state(tenant)

        self.assertTrue(state["access_allowed"])
        self.assertIsNone(state["redirect"])
        self.assertEqual(state["status"], "active")

    def test_trialing_allows_access(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "trialing",
        }

        state = get_billing_state(tenant)

        self.assertTrue(state["access_allowed"])
        self.assertIsNone(state["redirect"])

    def test_past_due_allows_access(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "past_due",
        }

        state = get_billing_state(tenant)

        self.assertTrue(state["access_allowed"])
        self.assertIsNone(state["redirect"])

    def test_all_active_statuses_allow_access(self):
        for status in ACTIVE_STATUSES:
            tenant = {
                "_id": "t1",
                "stripe_subscription_id": "sub_123",
                "stripe_subscription_status": status,
            }

            state = get_billing_state(tenant)

            self.assertTrue(
                state["access_allowed"],
                f"Status '{status}' should allow access",
            )

    def test_incomplete_redirects_to_portal(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "incomplete",
        }

        state = get_billing_state(tenant)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "portal")

    def test_unpaid_redirects_to_portal(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "unpaid",
        }

        state = get_billing_state(tenant)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "portal")

    def test_paused_redirects_to_portal(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "paused",
        }

        state = get_billing_state(tenant)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "portal")

    def test_all_recoverable_statuses_redirect_to_portal(self):
        for status in RECOVERABLE_STATUSES:
            tenant = {
                "_id": "t1",
                "stripe_subscription_id": "sub_123",
                "stripe_subscription_status": status,
            }

            state = get_billing_state(tenant)

            self.assertFalse(state["access_allowed"])
            self.assertEqual(
                state["redirect"],
                "portal",
                f"Status '{status}' should redirect to portal",
            )

    def test_canceled_redirects_to_pricing(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "canceled",
        }

        state = get_billing_state(tenant)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "pricing")

    def test_incomplete_expired_redirects_to_pricing(self):
        tenant = {
            "_id": "t1",
            "stripe_subscription_id": "sub_123",
            "stripe_subscription_status": "incomplete_expired",
        }

        state = get_billing_state(tenant)

        self.assertFalse(state["access_allowed"])
        self.assertEqual(state["redirect"], "pricing")

    def test_all_terminal_statuses_redirect_to_pricing(self):
        for status in TERMINAL_STATUSES:
            tenant = {
                "_id": "t1",
                "stripe_subscription_id": "sub_123",
                "stripe_subscription_status": status,
            }

            state = get_billing_state(tenant)

            self.assertFalse(state["access_allowed"])
            self.assertEqual(
                state["redirect"],
                "pricing",
                f"Status '{status}' should redirect to pricing",
            )


class SubscriptionLevelTest(TestCase):
    """Test get_subscription_level() extraction from Stripe objects."""

    def test_extracts_level_from_expanded_product(self):
        subscription = {
            "items": {
                "data": [
                    {
                        "price": {
                            "product": {
                                "metadata": {
                                    "subscription_level": "team",
                                },
                            },
                        },
                    }
                ],
            },
        }

        self.assertEqual(get_subscription_level(subscription), "team")

    def test_returns_none_for_missing_metadata(self):
        subscription = {
            "items": {
                "data": [
                    {
                        "price": {
                            "product": {
                                "metadata": {},
                            },
                        },
                    }
                ],
            },
        }

        self.assertIsNone(get_subscription_level(subscription))

    def test_returns_none_for_invalid_level(self):
        subscription = {
            "items": {
                "data": [
                    {
                        "price": {
                            "product": {
                                "metadata": {
                                    "subscription_level": "enterprise",
                                },
                            },
                        },
                    }
                ],
            },
        }

        self.assertIsNone(get_subscription_level(subscription))

    def test_returns_none_for_empty_items(self):
        subscription = {"items": {"data": []}}

        self.assertIsNone(get_subscription_level(subscription))

    def test_returns_none_for_no_items(self):
        subscription = {}

        self.assertIsNone(get_subscription_level(subscription))

    def test_solo_level(self):
        subscription = {
            "items": {
                "data": [
                    {
                        "price": {
                            "product": {
                                "metadata": {
                                    "subscription_level": "solo",
                                },
                            },
                        },
                    }
                ],
            },
        }

        self.assertEqual(get_subscription_level(subscription), "solo")

    @patch("liveblog.billing.service.stripe")
    def test_retrieves_product_when_not_expanded(self, mock_stripe):
        mock_stripe.Product.retrieve.return_value = {
            "metadata": {"subscription_level": "team"},
        }
        subscription = {
            "items": {
                "data": [
                    {
                        "price": {
                            "product": "prod_ABC123",
                        },
                    }
                ],
            },
        }

        result = get_subscription_level(subscription)

        self.assertEqual(result, "team")
        mock_stripe.Product.retrieve.assert_called_once_with("prod_ABC123")


class StripeSyncTest(TestCase):
    def setUp(self):
        self.app = flask.Flask(__name__)
        self.app.config["STRIPE_SECRET_KEY"] = "sk_test_123"

    @patch("liveblog.billing.service.update_tenant_subscription")
    @patch("liveblog.billing.service.stripe")
    def test_sync_updates_trialing_subscription(self, mock_stripe, mock_update):
        subscription = MagicMock()
        subscription.id = "sub_trial_123"
        subscription.status = "trialing"
        subscription.get.return_value = {
            "data": [
                {
                    "price": {
                        "product": {
                            "metadata": {"subscription_level": "team"},
                        }
                    }
                }
            ]
        }
        mock_stripe.Subscription.list.return_value = MagicMock(data=[subscription])
        tenant = {
            "_id": "tenant_123",
            "stripe_customer_id": "cus_123",
            "stripe_subscription_id": None,
            "stripe_subscription_status": None,
        }

        with self.app.app_context():
            synced_tenant = sync_subscription_from_stripe(tenant)

        mock_stripe.Subscription.list.assert_called_once_with(
            customer="cus_123", limit=1
        )
        mock_update.assert_called_once_with("tenant_123", subscription)
        self.assertEqual(synced_tenant["stripe_subscription_id"], "sub_trial_123")
        self.assertEqual(synced_tenant["stripe_subscription_status"], "trialing")
        self.assertEqual(synced_tenant["subscription_level"], "team")

    @patch("liveblog.billing.service.update_tenant_subscription")
    @patch("liveblog.billing.service.stripe")
    def test_sync_leaves_tenant_unchanged_when_no_subscription_found(
        self, mock_stripe, mock_update
    ):
        mock_stripe.Subscription.list.return_value = MagicMock(data=[])
        tenant = {
            "_id": "tenant_123",
            "stripe_customer_id": "cus_123",
            "stripe_subscription_id": None,
            "stripe_subscription_status": None,
        }

        with self.app.app_context():
            synced_tenant = sync_subscription_from_stripe(tenant.copy())

        mock_update.assert_not_called()
        self.assertIsNone(synced_tenant["stripe_subscription_id"])
        self.assertIsNone(synced_tenant["stripe_subscription_status"])
