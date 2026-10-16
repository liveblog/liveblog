import { Page } from '@playwright/test';
import Stripe from 'stripe';
import { test, expect } from '../../fixtures/billing';
import { ApiClient } from '../../api/client';
import { E2EUser, getBillingStatus, registerE2EUser, writeProbe } from '../../api/billing';
import { advanceClock, createClockCustomer, E2ECatalog, setRenewalCard, stripe, subscribeWithTestCard } from '../../api/stripe';
import { setStripeCustomer, waitForTenant } from '../../api/tenants-db';
import { BillingBannerPage } from '../../pages/billing-banner.page';
import { LoginPage } from '../../pages/login.page';
import { StripePortalPage } from '../../pages/stripe-portal.page';

// A Solo subscriber whose card starts being declined at renewal. Stripe keeps
// the subscription past_due while it retries the renewal invoice, and the
// app keeps full access during that time.

const PRODUCT_NAME = 'E2E LiveBlog Solo';
const HOUR_S = 3600;
// Advancing a test clock takes seconds to minutes, and the resulting webhooks
// arrive after the clock reports ready.
const CLOCK_TEST_TIMEOUT = 600_000;
const CLOCK_ADVANCE_TIMEOUT = 300_000;
const CLOCK_WEBHOOK_TIMEOUT = 180_000;
// Upper bound on the retries walked through. The sandbox's Smart Retries
// policy makes 8 over about two weeks.
const MAX_RETRIES = 15;

interface FailingRenewal {
    user: E2EUser;
    clockId: string;
    subscription: Stripe.Subscription;
}

async function renewalInvoice(subscriptionId: string): Promise<Stripe.Invoice> {
    const invoices = await stripe().invoices.list({ subscription: subscriptionId, limit: 1 });
    const invoice = invoices.data[0];
    expect(invoice?.billing_reason).toBe('subscription_cycle');
    return invoice;
}

/**
 * Subscribes a fresh tenant to Solo on a test clock, leaves it with only a
 * card that declines every charge, and advances the clock past the period
 * end so the renewal fails once and the tenant turns past_due.
 */
async function failFirstRenewal(api: ApiClient, catalog: E2ECatalog, tag: string): Promise<FailingRenewal> {
    const user = await registerE2EUser(api, tag);
    // A test clock can only be attached when a customer is created, so the
    // tenant is moved off the customer registration made for it.
    const { customer, clock } = await createClockCustomer({ email: user.email, name: `E2E ${tag}` });
    await setStripeCustomer(user.tenantId, customer.id);

    const subscription = await subscribeWithTestCard(customer.id, catalog.solo.monthlyPriceId);
    await waitForTenant(user.tenantId, {
        subscription_level: 'solo',
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: 'active',
    });

    const failingCard = await setRenewalCard(subscription.id, 'pm_card_chargeCustomerFail');
    expect(failingCard.card?.last4).toBe('0341');
    await stripe().paymentMethods.detach(subscription.default_payment_method as string);

    await advanceClock(clock.id, subscription.items.data[0].current_period_end + 2 * HOUR_S, CLOCK_ADVANCE_TIMEOUT);
    const invoice = await renewalInvoice(subscription.id);
    expect(invoice).toMatchObject({ status: 'open', attempt_count: 1 });
    expect(invoice.next_payment_attempt).not.toBeNull();
    expect((await stripe().subscriptions.retrieve(subscription.id)).status).toBe('past_due');

    await waitForTenant(user.tenantId, { subscription_level: 'solo', stripe_subscription_status: 'past_due' }, CLOCK_WEBHOOK_TIMEOUT);
    return { user, clockId: clock.id, subscription };
}

async function logIn(page: Page, user: E2EUser) {
    await new LoginPage(page).signIn(user.username, user.password);
}

test.describe('Payment failure', () => {
    test('a failed renewal keeps access while Stripe retries', async ({ page, api, catalog, shot }) => {
        test.setTimeout(CLOCK_TEST_TIMEOUT);
        const { user } = await failFirstRenewal(api, catalog, 'renewal-fails');

        await logIn(page, user);
        const banner = new BillingBannerPage(page);
        expect(await banner.load()).toMatchObject({ access_allowed: true, redirect: null, status: 'past_due' });
        await expect(banner.banner).toHaveCount(0);
        await shot('app while past due');

        expect((await writeProbe(api, user)).status).toBe(201);
    });

    // The sandbox is set to cancel the subscription once every retry has
    // failed (Dashboard: Billing, Revenue recovery). With that setting a
    // failed renewal never reaches `unpaid`, the "needs attention" state with
    // the Update Billing banner: the tenant goes from past_due straight to
    // canceled.
    test('when every retry fails Stripe cancels the subscription and the tenant loses access', async ({ page, api, catalog, shot }) => {
        test.setTimeout(CLOCK_TEST_TIMEOUT);
        const { user, clockId, subscription } = await failFirstRenewal(api, catalog, 'retries-run-out');

        let invoice = await renewalInvoice(subscription.id);
        for (let retries = 0; invoice.next_payment_attempt; retries++) {
            expect(retries, 'Stripe kept retrying the renewal invoice').toBeLessThan(MAX_RETRIES);
            expect(await getBillingStatus(api, user)).toMatchObject({ access_allowed: true, status: 'past_due' });
            await advanceClock(clockId, invoice.next_payment_attempt + HOUR_S, CLOCK_ADVANCE_TIMEOUT);
            invoice = await renewalInvoice(subscription.id);
        }
        expect(invoice.status).toBe('open');
        expect(invoice.attempt_count).toBeGreaterThan(1);

        const canceled = await stripe().subscriptions.retrieve(subscription.id);
        expect(canceled.status, 'the sandbox no longer cancels after the last failed retry; check its Revenue recovery settings').toBe('canceled');
        expect(canceled.cancellation_details?.reason).toBe('payment_failed');

        // reset_tenant_subscription drops the level back to solo.
        await waitForTenant(user.tenantId, { subscription_level: 'solo', stripe_subscription_status: 'canceled' }, CLOCK_WEBHOOK_TIMEOUT);

        await logIn(page, user);
        const banner = new BillingBannerPage(page);
        expect(await banner.load()).toMatchObject({ access_allowed: false, redirect: 'pricing', status: 'canceled' });
        await expect(banner.banner).toContainText('Your subscription is inactive.');
        await expect(banner.contactSupportLink).toBeVisible();
        await expect(banner.updateBillingButton).toHaveCount(0);
        await shot('app after the last retry failed');

        const blocked = await writeProbe(api, user);
        expect(blocked.status).toBe(403);
        expect(blocked.body).toMatchObject({ _issues: { billing_error: 'SUBSCRIPTION_REQUIRED', redirect: 'pricing', status: 'canceled' } });
    });

    test('a past due subscriber replaces the card in the Customer Portal and the next retry pays', async ({ page, api, catalog, shot, baseURL }) => {
        test.setTimeout(CLOCK_TEST_TIMEOUT);
        const { user, clockId, subscription } = await failFirstRenewal(api, catalog, 'card-replaced');

        await logIn(page, user);
        const portal = await StripePortalPage.openFromUserMenu(page);
        await expect(portal.outstandingInvoices.getByRole('link', { name: 'Pay now' })).toBeVisible();
        await expect(portal.activePlan(PRODUCT_NAME)).toContainText('Overdue');
        await shot('portal overview while past due');

        await portal.openWallet();
        await expect(portal.walletCard('0341')).toContainText('Default');
        await shot('portal wallet with the declining card');

        await portal.fillNewCard();
        await shot('portal new card filled');

        await portal.saveNewCard();
        await expect(portal.walletCard('4242')).toContainText('Default');
        await shot('portal wallet after adding a card');

        // The portal makes the new card the customer's default and clears the
        // subscription's own default, so renewals use the new card. It does
        // not pay the open invoice; the next scheduled retry does.
        const updated = await stripe().subscriptions.retrieve(subscription.id, { expand: ['customer.invoice_settings.default_payment_method'] });
        expect(updated.default_payment_method).toBeNull();
        const customer = updated.customer as Stripe.Customer;
        expect((customer.invoice_settings.default_payment_method as Stripe.PaymentMethod).card?.last4).toBe('4242');
        const invoice = await renewalInvoice(subscription.id);
        expect(invoice).toMatchObject({ status: 'open', attempt_count: 1 });

        await portal.returnTo(baseURL as string);
        await new LoginPage(page).waitForSession();

        await advanceClock(clockId, (invoice.next_payment_attempt as number) + HOUR_S, CLOCK_ADVANCE_TIMEOUT);
        expect(await renewalInvoice(subscription.id)).toMatchObject({ status: 'paid', attempt_count: 2 });
        await waitForTenant(user.tenantId, { subscription_level: 'solo', stripe_subscription_status: 'active' }, CLOCK_WEBHOOK_TIMEOUT);

        const banner = new BillingBannerPage(page);
        expect(await banner.load()).toMatchObject({ access_allowed: true, redirect: null, status: 'active' });
        await expect(banner.banner).toHaveCount(0);
        await shot('app after the retry paid');
        expect((await writeProbe(api, user)).status).toBe(201);
    });
});
