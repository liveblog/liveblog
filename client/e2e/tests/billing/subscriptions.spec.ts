import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/billing';
import { createCheckoutSession, E2EUser, registerE2EUser, writeProbe } from '../../api/billing';
import { advanceClock, createClockCustomer, stripe, subscribeWithTestCard } from '../../api/stripe';
import { expireGoPlan, getTenant, setGoPlan, setStripeCustomer, TenantBilling } from '../../api/tenants-db';
import { BillingBannerPage } from '../../pages/billing-banner.page';
import { LoginPage } from '../../pages/login.page';
import { StripeCheckoutPage } from '../../pages/stripe-checkout.page';
import { StripePortalPage } from '../../pages/stripe-portal.page';

// Solo and Team: recurring subscriptions, managed by the customer in the
// Stripe Customer Portal (plan switching and cancellation at period end).

const PRODUCT_NAMES = {
    solo: 'E2E LiveBlog Solo',
    team: 'E2E LiveBlog Team',
} as const;
type Plan = keyof typeof PRODUCT_NAMES;

const DAY_MS = 86_400_000;
// Hosted Checkout or Portal plus the webhook round trip.
const HOSTED_TEST_TIMEOUT = 240_000;
const WEBHOOK_TIMEOUT = 60_000;
// Advancing a test clock past a billing period can take minutes, and the
// resulting webhooks arrive after the clock reports ready.
const CLOCK_TEST_TIMEOUT = 600_000;
const CLOCK_ADVANCE_TIMEOUT = 300_000;
const CLOCK_WEBHOOK_TIMEOUT = 180_000;

/**
 * Polls the tenant in Mongo. /billing/status can sync a subscription from
 * Stripe by itself, so only the stored tenant proves the webhook ran.
 */
async function waitForTenant(tenantId: string, expected: Partial<TenantBilling>, timeout = WEBHOOK_TIMEOUT): Promise<TenantBilling> {
    await expect.poll(async () => {
        const tenant = await getTenant(tenantId);
        return Object.fromEntries(Object.keys(expected).map((key) => [key, tenant[key as keyof TenantBilling]]));
    }, { timeout, message: `tenant ${tenantId} never reached ${JSON.stringify(expected)}` }).toEqual(expected);
    return getTenant(tenantId);
}

async function subscribe(user: E2EUser, customerId: string, plan: Plan, priceId: string) {
    const subscription = await subscribeWithTestCard(customerId, priceId);
    await waitForTenant(user.tenantId, {
        subscription_level: plan,
        stripe_subscription_id: subscription.id,
        stripe_subscription_status: 'active',
    });
    return subscription;
}

async function logIn(page: Page, user: E2EUser) {
    await new LoginPage(page).signIn(user.username, user.password);
}

/** Opens the Customer Portal the way a subscriber does: avatar, then "Subscription". */
async function openPortalFromUserMenu(page: Page): Promise<StripePortalPage> {
    // The link only gets its click handler once its own /billing/status
    // request resolves, and the menu renders it only when opened.
    const linkReady = page.waitForResponse(
        (response) => response.url().includes('/billing/status') && response.request().method() === 'GET',
        { timeout: 30_000 },
    );
    await page.locator('button.current-user').click();
    await linkReady;
    await page.locator('[sd-manage-subscription]').click();

    const portal = new StripePortalPage(page);
    await portal.waitForOverview();
    return portal;
}

/**
 * Makes the browser's /billing/status requests fail until the returned
 * function is called. The app requests it on boot, and for a tenant without
 * subscription fields that request syncs the subscription from Stripe, which
 * would mask a webhook that never arrived.
 */
async function holdBillingStatus(page: Page): Promise<() => Promise<void>> {
    const matcher = (url: URL) => url.pathname.endsWith('/billing/status');
    await page.route(matcher, (route) => route.abort());
    return () => page.unroute(matcher);
}

test.describe('Subscriptions', () => {
    for (const plan of ['solo', 'team'] as const) {
        test(`an expired Go user subscribes to ${plan} and can write again`, async ({ page, api, catalog, shot, baseURL }) => {
            test.setTimeout(HOSTED_TEST_TIMEOUT);
            const priceId = catalog[plan].monthlyPriceId;
            const productName = PRODUCT_NAMES[plan];

            const user = await registerE2EUser(api, `go-to-${plan}`);
            await setGoPlan(user.tenantId, { priceId: catalog.go.priceId, expiresAt: new Date(Date.now() + 3 * DAY_MS) });
            await expireGoPlan(user.tenantId);
            const expiredAt = (await getTenant(user.tenantId)).plan_expires_at as Date;
            expect((await writeProbe(api, user)).status).toBe(403);

            await logIn(page, user);
            const banner = new BillingBannerPage(page);
            // The banner only reads /billing/status when the app boots with a
            // session, and logging in does not reload the page.
            await banner.load();
            await expect(banner.extendButton).toBeVisible();
            await shot('expired go banner before subscribing');

            // The app has no way for an existing user to start a Solo or Team
            // subscription: the banner only extends Go and the pricing link
            // goes to the marketing site. Checkout is started through the API
            // as that user, as the register page would do for a new one.
            const session = await createCheckoutSession(api, user, priceId, baseURL);
            expect(session.status).toBe(200);
            const checkoutUrl = (session.body as { url: string }).url;

            const releaseBillingStatus = await holdBillingStatus(page);
            await page.goto(checkoutUrl);
            const checkout = new StripeCheckoutPage(page);
            await checkout.waitForLoaded(productName);
            await expect(checkout.submitButton).toHaveText(/subscribe/i);
            await shot(`stripe checkout ${plan} landing`);

            await checkout.selectCard();
            await checkout.fillCard();
            await shot(`stripe checkout ${plan} card filled`);

            await checkout.submit();
            await checkout.waitForReturn(baseURL as string);

            const tenant = await waitForTenant(user.tenantId, {
                subscription_level: plan,
                stripe_subscription_status: 'active',
            });
            expect(tenant.stripe_subscription_id).toMatch(/^sub_/);
            // The Go expiry is kept, still in the past: an active
            // subscription must win over it.
            expect(tenant.plan_expires_at).toEqual(expiredAt);
            expect(expiredAt.getTime()).toBeLessThan(Date.now());

            await releaseBillingStatus();
            await new LoginPage(page).waitForSession();
            expect(await banner.load()).toMatchObject({ access_allowed: true, redirect: null, status: 'active' });
            await expect(banner.banner).toHaveCount(0);
            await shot(`app subscribed to ${plan}`);

            expect((await writeProbe(api, user)).status).toBe(201);
        });
    }

    test('a Team subscriber downgrades to Solo in the Customer Portal', async ({ page, api, catalog, shot, baseURL }) => {
        test.setTimeout(HOSTED_TEST_TIMEOUT);
        const user = await registerE2EUser(api, 'team-downgrade');
        expect(user.customerId).toMatch(/^cus_/);
        const subscription = await subscribe(user, user.customerId as string, 'team', catalog.team.monthlyPriceId);

        await logIn(page, user);
        await shot('app as team subscriber');

        const portal = await openPortalFromUserMenu(page);
        await expect(portal.activePlan(PRODUCT_NAMES.team)).toBeVisible();
        await shot('portal overview team');

        await portal.openPlan(PRODUCT_NAMES.team);
        await shot('portal team plan');

        await portal.startPlanUpdate();
        await expect(portal.planCard(PRODUCT_NAMES.solo)).toBeVisible();
        await shot('portal choose plan');

        await portal.selectPlan(PRODUCT_NAMES.solo);
        await shot('portal downgrade summary');

        await portal.confirmPlanUpdate(PRODUCT_NAMES.solo);
        await shot('portal solo plan after downgrade');

        await waitForTenant(user.tenantId, {
            subscription_level: 'solo',
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: 'active',
        });
        const updated = await stripe().subscriptions.retrieve(subscription.id);
        expect(updated.items.data.map((item) => item.price.id)).toEqual([catalog.solo.monthlyPriceId]);

        await portal.returnTo(baseURL as string);
        await new LoginPage(page).waitForSession();
        const banner = new BillingBannerPage(page);
        expect(await banner.load()).toMatchObject({ access_allowed: true, status: 'active' });
        await expect(banner.banner).toHaveCount(0);
        await shot('app after downgrade');
    });

    test('cancelling in the Customer Portal keeps access until the period ends', async ({ page, api, catalog, shot, baseURL }) => {
        test.setTimeout(CLOCK_TEST_TIMEOUT);
        const user = await registerE2EUser(api, 'cancel');
        // A test clock can only be attached when a customer is created, so the
        // tenant is moved off the customer registration made for it.
        const { customer, clock } = await createClockCustomer({ email: user.email, name: 'E2E Cancel' });
        await setStripeCustomer(user.tenantId, customer.id);
        const subscription = await subscribe(user, customer.id, 'team', catalog.team.monthlyPriceId);

        await logIn(page, user);
        const portal = await openPortalFromUserMenu(page);
        await shot('portal overview before cancel');

        await portal.openPlan(PRODUCT_NAMES.team);
        await shot('portal team plan before cancel');

        await portal.startCancel();
        await shot('portal cancel review');

        await portal.chooseCancelReason('I no longer need it');
        await shot('portal cancel reason chosen');

        await portal.confirmCancel();
        await shot('portal plan canceled');

        await portal.done();
        await shot('portal after cancel');

        await portal.returnTo(baseURL as string);
        await new LoginPage(page).waitForSession();

        // The portal schedules the cancellation with `cancel_at` at the end
        // of the current period; `cancel_at_period_end` stays false.
        await expect.poll(async () => {
            const canceling = await stripe().subscriptions.retrieve(subscription.id);
            return {
                status: canceling.status,
                cancel_at: canceling.cancel_at,
                feedback: canceling.cancellation_details?.feedback,
            };
        }, { timeout: WEBHOOK_TIMEOUT }).toEqual({
            status: 'active',
            cancel_at: subscription.items.data[0].current_period_end,
            feedback: 'unused',
        });
        expect(await getTenant(user.tenantId)).toMatchObject({ subscription_level: 'team', stripe_subscription_status: 'active' });

        const banner = new BillingBannerPage(page);
        expect(await banner.load()).toMatchObject({ access_allowed: true, status: 'active' });
        await expect(banner.banner).toHaveCount(0);
        await shot('app after cancel before period end');
        expect((await writeProbe(api, user)).status).toBe(201);

        await advanceClock(clock.id, { days: 32 }, CLOCK_ADVANCE_TIMEOUT);
        // reset_tenant_subscription drops the level back to solo.
        await waitForTenant(user.tenantId, { subscription_level: 'solo', stripe_subscription_status: 'canceled' }, CLOCK_WEBHOOK_TIMEOUT);

        expect(await banner.load()).toMatchObject({ access_allowed: false, redirect: 'pricing', status: 'canceled' });
        await expect(banner.banner).toContainText('Your subscription is inactive.');
        await expect(banner.contactSupportLink).toBeVisible();
        await shot('app after period end');

        const blocked = await writeProbe(api, user);
        expect(blocked.status).toBe(403);
        expect(blocked.body).toMatchObject({ _issues: { billing_error: 'SUBSCRIPTION_REQUIRED', redirect: 'pricing', status: 'canceled' } });
    });
});
