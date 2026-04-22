"""
Tests for billing service business logic.
"""
import flask
import uuid
import stripe as stripe_sdk
from bson import ObjectId
from unittest import TestCase
from unittest.mock import patch, MagicMock

from superdesk import get_resource_service
from superdesk.tests import TestCase as SuperdeskTestCase
from liveblog import tenants
from liveblog.common import run_once
from liveblog.billing.service import (
    ensure_stripe_customer,
    find_tenant_by_customer,
    get_billing_state,
    get_subscription_level,
    reset_tenant_subscription,
    sync_subscription_from_stripe,
    update_tenant_subscription,
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

    @patch("liveblog.billing.service.update_tenant_subscription")
    @patch("liveblog.billing.service.stripe")
    def test_sync_updates_past_due_subscription(self, mock_stripe, mock_update):
        subscription = MagicMock()
        subscription.id = "sub_due_123"
        subscription.status = "past_due"
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

        mock_update.assert_called_once_with("tenant_123", subscription)
        self.assertEqual(synced_tenant["stripe_subscription_status"], "past_due")
        self.assertEqual(synced_tenant["subscription_level"], "team")

    @patch("liveblog.billing.service.stripe")
    def test_sync_does_not_call_stripe_when_no_customer(self, mock_stripe):
        tenant = {
            "_id": "tenant_123",
            "stripe_customer_id": None,
            "stripe_subscription_id": None,
            "stripe_subscription_status": None,
        }

        with self.app.app_context():
            synced_tenant = sync_subscription_from_stripe(tenant)

        mock_stripe.Subscription.list.assert_not_called()
        self.assertEqual(synced_tenant, tenant)

    @patch("liveblog.billing.service.stripe")
    def test_sync_does_not_call_stripe_when_subscription_is_already_active(
        self, mock_stripe
    ):
        tenant = {
            "_id": "tenant_123",
            "stripe_customer_id": "cus_123",
            "stripe_subscription_id": "sub_active_123",
            "stripe_subscription_status": "active",
        }

        with self.app.app_context():
            synced_tenant = sync_subscription_from_stripe(tenant)

        mock_stripe.Subscription.list.assert_not_called()
        self.assertEqual(synced_tenant, tenant)

    @patch("liveblog.billing.service.stripe")
    def test_sync_returns_unchanged_when_secret_key_missing(self, mock_stripe):
        tenant = {
            "_id": "tenant_123",
            "stripe_customer_id": "cus_123",
            "stripe_subscription_id": None,
            "stripe_subscription_status": None,
        }
        self.app.config["STRIPE_SECRET_KEY"] = None

        with self.app.app_context():
            synced_tenant = sync_subscription_from_stripe(tenant.copy())

        mock_stripe.Subscription.list.assert_not_called()
        self.assertEqual(synced_tenant, tenant)

    @patch("liveblog.billing.service.update_tenant_subscription")
    @patch("liveblog.billing.service.stripe.Subscription.list")
    def test_sync_returns_unchanged_on_stripe_error(self, mock_list, mock_update):
        tenant = {
            "_id": "tenant_123",
            "stripe_customer_id": "cus_123",
            "stripe_subscription_id": None,
            "stripe_subscription_status": None,
        }
        mock_list.side_effect = stripe_sdk.error.InvalidRequestError("boom", "customer")

        with self.app.app_context():
            synced_tenant = sync_subscription_from_stripe(tenant.copy())

        mock_update.assert_not_called()
        self.assertEqual(synced_tenant, tenant)


class TenantSubscriptionPersistenceTest(SuperdeskTestCase):
    @run_once
    def setup_test_case(self):
        self.app.config.update(
            {
                "LIVEBLOG_DEBUG": True,
                "DEBUG": False,
                "STRIPE_SECRET_KEY": "sk_test_123",
            }
        )
        tenants.init_app(self.app)

    def setUp(self):
        super().setUp()
        self.setup_test_case()

    def _create_tenant(self, **updates):
        tenant_doc = {
            "name": "Billing Tenant " + uuid.uuid4().hex[:8],
            "subscription_level": "solo",
        }
        tenant_doc.update(updates)
        return ObjectId(get_resource_service("tenants").post([tenant_doc])[0])

    def test_find_tenant_by_customer_returns_matching_tenant(self):
        tenant_id = self._create_tenant(stripe_customer_id="cus_db_123")

        tenant = find_tenant_by_customer("cus_db_123")

        self.assertIsNotNone(tenant)
        self.assertEqual(tenant["_id"], tenant_id)

    def test_find_tenant_by_customer_returns_none_when_missing(self):
        self.assertIsNone(find_tenant_by_customer("cus_missing"))

    def test_update_tenant_subscription_updates_level_status_and_sub_id(self):
        tenant_id = self._create_tenant()
        subscription = {
            "id": "sub_db_123",
            "status": "trialing",
            "items": {
                "data": [
                    {"price": {"product": {"metadata": {"subscription_level": "team"}}}}
                ]
            },
        }

        update_tenant_subscription(tenant_id, subscription)

        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertEqual(tenant["subscription_level"], "team")
        self.assertEqual(tenant["stripe_subscription_id"], "sub_db_123")
        self.assertEqual(tenant["stripe_subscription_status"], "trialing")

    def test_update_tenant_subscription_accepts_string_tenant_id(self):
        tenant_id = self._create_tenant()
        subscription = {
            "id": "sub_db_456",
            "status": "active",
            "items": {
                "data": [
                    {"price": {"product": {"metadata": {"subscription_level": "solo"}}}}
                ]
            },
        }

        update_tenant_subscription(str(tenant_id), subscription)

        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertEqual(tenant["subscription_level"], "solo")
        self.assertEqual(tenant["stripe_subscription_id"], "sub_db_456")
        self.assertEqual(tenant["stripe_subscription_status"], "active")

    def test_reset_tenant_subscription_sets_solo_and_canceled(self):
        tenant_id = self._create_tenant(
            subscription_level="team",
            stripe_subscription_id="sub_old_123",
            stripe_subscription_status="active",
        )

        reset_tenant_subscription(tenant_id)

        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertEqual(tenant["subscription_level"], "solo")
        self.assertEqual(tenant["stripe_subscription_id"], "sub_old_123")
        self.assertEqual(tenant["stripe_subscription_status"], "canceled")

    def test_reset_tenant_subscription_accepts_string_tenant_id(self):
        tenant_id = self._create_tenant(
            subscription_level="team",
            stripe_subscription_id="sub_old_456",
            stripe_subscription_status="active",
        )

        reset_tenant_subscription(str(tenant_id))

        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertEqual(tenant["subscription_level"], "solo")
        self.assertEqual(tenant["stripe_subscription_id"], "sub_old_456")
        self.assertEqual(tenant["stripe_subscription_status"], "canceled")

    @patch("liveblog.billing.service.stripe")
    def test_returns_existing_customer_without_creating_new_one(self, mock_stripe):
        tenant_id = self._create_tenant(stripe_customer_id="cus_existing_123")
        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)

        customer_id, error = ensure_stripe_customer(tenant)

        self.assertEqual(customer_id, "cus_existing_123")
        self.assertIsNone(error)
        mock_stripe.Customer.create.assert_not_called()

    @patch("liveblog.billing.service.stripe")
    def test_creates_customer_and_persists_customer_id(self, mock_stripe):
        tenant_id = self._create_tenant()
        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        mock_stripe.Customer.create.return_value = type(
            "Customer", (), {"id": "cus_created_123"}
        )()

        customer_id, error = ensure_stripe_customer(
            tenant,
            user_email="billing@example.com",
            tenant_name=tenant["name"],
        )

        self.assertEqual(customer_id, "cus_created_123")
        self.assertIsNone(error)
        persisted = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertEqual(persisted["stripe_customer_id"], "cus_created_123")

    @patch("liveblog.billing.service.stripe")
    def test_creates_customer_when_tenant_id_is_string(self, mock_stripe):
        tenant_id = self._create_tenant()
        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        tenant["_id"] = str(tenant["_id"])
        mock_stripe.Customer.create.return_value = type(
            "Customer", (), {"id": "cus_created_str_123"}
        )()

        customer_id, error = ensure_stripe_customer(tenant)

        self.assertEqual(customer_id, "cus_created_str_123")
        self.assertIsNone(error)
        persisted = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.assertEqual(persisted["stripe_customer_id"], "cus_created_str_123")

    def test_returns_error_when_billing_not_configured(self):
        tenant_id = self._create_tenant()
        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        self.app.config["STRIPE_SECRET_KEY"] = None

        customer_id, error = ensure_stripe_customer(tenant)

        self.assertIsNone(customer_id)
        self.assertEqual(error, "Billing not configured")

    @patch("liveblog.billing.service.stripe.Customer.create")
    def test_returns_error_on_stripe_failure(self, mock_create):
        tenant_id = self._create_tenant()
        tenant = get_resource_service("tenants").find_one(req=None, _id=tenant_id)
        mock_create.side_effect = stripe_sdk.error.InvalidRequestError(
            "boom", "customer"
        )

        customer_id, error = ensure_stripe_customer(tenant)

        self.assertIsNone(customer_id)
        self.assertEqual(error, "Unable to set up billing. Please try again.")
