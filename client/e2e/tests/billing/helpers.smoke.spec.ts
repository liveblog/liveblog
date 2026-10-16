import { test, expect } from '../../fixtures/billing';
import { createCheckoutSession, getBillingStatus, registerE2EUser } from '../../api/billing';
import {
    advanceClock,
    cancelSubscription,
    createClockCustomer,
    subscribeWithTestCard,
} from '../../api/stripe';
import { expireGoPlan, getTenant, setGoPlan, setStripeCustomer } from '../../api/tenants-db';

// Exercises the Stripe e2e helpers against the live stack without the
// hosted Checkout UI: registration, billing status, checkout session
// creation, webhook-driven tenant updates, test clocks and DB overrides.

const WEBHOOK_TIMEOUT = 30_000;

test('a test card subscription reaches the tenant through the webhook', async ({ api, catalog }) => {
    test.setTimeout(90_000);
    const user = await registerE2EUser(api, 'smoke-sub');
    expect(user.customerId).toMatch(/^cus_/);

    expect(await getBillingStatus(api, user)).toMatchObject({
        billing_required: true,
        access_allowed: false,
        redirect: 'pricing',
    });

    const checkout = await createCheckoutSession(api, user, catalog.solo.monthlyPriceId);
    expect(checkout.status).toBe(200);
    expect((checkout.body as { url: string }).url).toContain('checkout.stripe.com');

    const archived = await createCheckoutSession(api, user, catalog.go.legacyPriceId);
    expect(archived.status).toBe(400);
    expect(archived.body).toMatchObject({ _error: 'This plan is no longer available' });

    await subscribeWithTestCard(user.customerId as string, catalog.solo.monthlyPriceId);

    // Polls the DB rather than /billing/status: the status endpoint syncs a
    // missing subscription from Stripe itself, which would hide a broken webhook.
    await expect.poll(() => getTenant(user.tenantId), { timeout: WEBHOOK_TIMEOUT })
        .toMatchObject({ subscription_level: 'solo', stripe_subscription_status: 'active' });
    expect(await getBillingStatus(api, user)).toMatchObject({
        access_allowed: true,
        redirect: null,
        status: 'active',
    });
});

test('an expired Go plan reports extend with the archived price fallback', async ({ api, catalog }) => {
    const user = await registerE2EUser(api, 'smoke-go');

    await setGoPlan(user.tenantId, {
        priceId: catalog.go.legacyPriceId,
        expiresAt: new Date(Date.now() + 3 * 86400_000),
    });
    expect(await getBillingStatus(api, user)).toMatchObject({ access_allowed: true, status: 'active' });

    await expireGoPlan(user.tenantId);
    expect(await getBillingStatus(api, user)).toMatchObject({
        access_allowed: false,
        redirect: 'extend',
        status: 'expired',
        checkout_price_id: catalog.go.priceId,
    });

    await setGoPlan(user.tenantId, {
        priceId: catalog.goDiscontinued.priceId,
        expiresAt: new Date(Date.now() - 60_000),
    });
    const discontinued = await getBillingStatus(api, user);
    expect(discontinued).toMatchObject({ access_allowed: false, redirect: 'pricing', status: 'expired' });
    expect(discontinued.checkout_price_id).toBeUndefined();
});

test('a test clock customer drives the tenant and cancels cleanly', async ({ api, catalog }) => {
    test.setTimeout(150_000);
    const user = await registerE2EUser(api, 'smoke-clock');
    const { customer, clock } = await createClockCustomer({ email: user.email });
    await setStripeCustomer(user.tenantId, customer.id);

    const subscription = await subscribeWithTestCard(customer.id, catalog.team.monthlyPriceId);
    await expect.poll(async () => (await getTenant(user.tenantId)).subscription_level, { timeout: WEBHOOK_TIMEOUT })
        .toBe('team');
    expect(await getBillingStatus(api, user)).toMatchObject({ access_allowed: true, status: 'active' });

    const advanced = await advanceClock(clock.id, { days: 1 });
    expect(advanced.status).toBe('ready');

    await cancelSubscription(subscription.id);
    await expect.poll(() => getBillingStatus(api, user), { timeout: WEBHOOK_TIMEOUT })
        .toMatchObject({ access_allowed: false, redirect: 'pricing', status: 'canceled' });
});
