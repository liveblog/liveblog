import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/billing';
import {
    E2EUser,
    createCheckoutSession,
    getBillingStatus,
    registerE2EUser,
    trackRegisteredCustomer,
    writeProbe,
} from '../../api/billing';
import { ApiClient } from '../../api/client';
import { e2eEmail } from '../../api/stripe';
import { expireGoPlan, findTenantByUser, getTenant, setGoPlan } from '../../api/tenants-db';
import { BillingBannerPage } from '../../pages/billing-banner.page';
import { LoginPage } from '../../pages/login.page';
import { RegisterPage } from '../../pages/register.page';
import { StripeCheckoutPage } from '../../pages/stripe-checkout.page';

// LiveBlog Go: a one-time payment that grants `plan_duration_days` (3 for
// the e2e product) of access, then expires and offers an extend Checkout.

const GO_PRODUCT_NAME = 'E2E LiveBlog Go';
const GO_DAYS = 3;
const DAY_MS = 86_400_000;
// Hosted Checkout plus the webhook round trip.
const CHECKOUT_TEST_TIMEOUT = 240_000;
const WEBHOOK_TIMEOUT = 60_000;

const PASSWORD = 'E2e-password-123!';

/** The webhook (not /billing/status) is the only writer of a Go purchase, so the tenant in Mongo proves it ran. */
async function waitForGoPlanWebhook(tenantId: string, priceId: string) {
    await expect.poll(async () => {
        const tenant = await getTenant(tenantId);
        return {
            subscription_level: tenant.subscription_level,
            plan_price_id: tenant.plan_price_id,
            active: !!tenant.plan_expires_at && tenant.plan_expires_at.getTime() > Date.now(),
        };
    }, { timeout: WEBHOOK_TIMEOUT, message: 'Go purchase webhook did not update the tenant' })
        .toEqual({ subscription_level: 'liveblog-go', plan_price_id: priceId, active: true });
    return getTenant(tenantId);
}

/** Asserts `expiresAt` is GO_DAYS after some instant in [from, to], with a minute of slack. */
function expectGoExpiry(expiresAt: Date | null | undefined, from: number, to: number) {
    expect(expiresAt).toBeInstanceOf(Date);
    const expires = (expiresAt as Date).getTime();
    expect(expires).toBeGreaterThanOrEqual(from + GO_DAYS * DAY_MS - 60_000);
    expect(expires).toBeLessThanOrEqual(to + GO_DAYS * DAY_MS + 60_000);
}

async function registerExpiredGoUser(api: ApiClient, tag: string, priceId: string): Promise<E2EUser> {
    const user = await registerE2EUser(api, tag);
    await setGoPlan(user.tenantId, { priceId, expiresAt: new Date(Date.now() + GO_DAYS * DAY_MS) });
    await expireGoPlan(user.tenantId);
    return user;
}

async function logIn(page: Page, user: E2EUser) {
    await new LoginPage(page).signIn(user.username, user.password);
}

async function waitForApp(page: Page) {
    await new LoginPage(page).waitForSession();
}

test.describe('LiveBlog Go', () => {
    test('buying Go at signup activates the plan through the webhook', async ({ page, catalog, shot, baseURL }) => {
        test.setTimeout(CHECKOUT_TEST_TIMEOUT);
        const email = e2eEmail('go-signup');
        const username = `e2e${email.slice('e2e+'.length, email.indexOf('@')).replace(/[^a-z0-9]/gi, '')}`;

        const register = new RegisterPage(page);
        await register.open(catalog.go.priceId);
        await expect(page.getByText(GO_PRODUCT_NAME).first()).toBeVisible();
        await shot('register with Go plan');

        await register.register({ firstName: 'E2E', lastName: 'Go signup', email, username, password: PASSWORD });

        const checkout = new StripeCheckoutPage(page);
        try {
            await checkout.waitForLoaded(GO_PRODUCT_NAME);
        } finally {
            // Registration creates the Stripe customer even if the redirect fails.
            await trackRegisteredCustomer(email).catch(() => undefined);
        }
        await shot('stripe checkout go landing');

        await checkout.selectCard();
        await checkout.fillCard();
        await expect(checkout.saveInfoCheckbox).not.toBeChecked();
        await shot('stripe checkout go card filled');

        const paidFrom = Date.now();
        await checkout.submit();
        await checkout.waitForReturn(baseURL as string);
        await waitForApp(page);
        await shot('back in app after paying');

        const tenant = await waitForGoPlanWebhook((await findTenantByUser(email))._id, catalog.go.priceId);
        expectGoExpiry(tenant.plan_expires_at, paidFrom, Date.now());

        const banner = new BillingBannerPage(page);
        const status = await banner.load();
        expect(status).toMatchObject({ access_allowed: true, status: 'active' });
        await expect(banner.banner).toHaveCount(0);
        await shot('app with active go plan');
    });

    test('an expired Go plan blocks writes until it is extended with the same price', async ({ page, api, catalog, shot, baseURL }) => {
        test.setTimeout(CHECKOUT_TEST_TIMEOUT);
        const user = await registerExpiredGoUser(api, 'go-extend', catalog.go.priceId);

        const blocked = await writeProbe(api, user);
        expect(blocked.status).toBe(403);
        expect(blocked.body).toMatchObject({ _issues: { billing_error: 'SUBSCRIPTION_REQUIRED', redirect: 'extend' } });

        await logIn(page, user);
        // The banner only reads /billing/status when the app boots with a
        // session, and logging in does not reload the page.
        const banner = new BillingBannerPage(page);
        const status = await banner.load();
        expect(status).toMatchObject({ redirect: 'extend', checkout_price_id: catalog.go.priceId });
        await expect(banner.banner).toContainText('Your plan has expired.');
        await expect(banner.extendButton).toBeVisible();
        await shot('expired go banner with extend');

        await banner.extendButton.click();
        const checkout = new StripeCheckoutPage(page);
        await checkout.waitForLoaded(GO_PRODUCT_NAME);
        await shot('stripe checkout go extend landing');

        await checkout.selectCard();
        await checkout.fillCard();
        await shot('stripe checkout go extend card filled');

        const paidFrom = Date.now();
        await checkout.submit();
        await checkout.waitForReturn(baseURL as string);
        await waitForApp(page);

        const tenant = await waitForGoPlanWebhook(user.tenantId, catalog.go.priceId);
        expectGoExpiry(tenant.plan_expires_at, paidFrom, Date.now());

        expect(await banner.load()).toMatchObject({ access_allowed: true, status: 'active' });
        await expect(banner.banner).toHaveCount(0);
        await shot('app after extending go');

        expect((await writeProbe(api, user)).status).toBe(201);
    });

    test('extending a Go plan bought with an archived price checks out the current default price', async ({ page, api, catalog, shot, baseURL }) => {
        test.setTimeout(CHECKOUT_TEST_TIMEOUT);
        const user = await registerExpiredGoUser(api, 'go-legacy', catalog.go.legacyPriceId);

        expect(await getBillingStatus(api, user)).toMatchObject({
            access_allowed: false,
            redirect: 'extend',
            checkout_price_id: catalog.go.priceId,
        });

        await logIn(page, user);
        const banner = new BillingBannerPage(page);
        await banner.load();
        await expect(banner.extendButton).toBeVisible();
        await shot('expired legacy go banner with extend');

        await banner.extendButton.click();
        const checkout = new StripeCheckoutPage(page);
        await checkout.waitForLoaded(GO_PRODUCT_NAME);
        // The EUR amount is shown either as the line item price or, with
        // adaptive pricing, as the EUR option of the currency chooser. The
        // archived legacy price is EUR 2.00, the default EUR 3.00.
        await expect(page.getByText('€3.00').first()).toBeVisible();
        await expect(page.getByText('€2.00')).toHaveCount(0);
        await shot('stripe checkout go default price landing');

        const paidFrom = Date.now();
        await checkout.payWithCard();
        await checkout.waitForReturn(baseURL as string);

        const tenant = await waitForGoPlanWebhook(user.tenantId, catalog.go.priceId);
        expectGoExpiry(tenant.plan_expires_at, paidFrom, Date.now());

        await waitForApp(page);
        expect(await banner.load()).toMatchObject({ access_allowed: true });
        await expect(banner.banner).toHaveCount(0);
        await shot('app after extending legacy go');
    });

    test('an expired Go plan with no purchasable price asks the user to contact support', async ({ page, api, catalog, shot }) => {
        test.setTimeout(90_000);
        const user = await registerExpiredGoUser(api, 'go-discontinued', catalog.goDiscontinued.priceId);

        const status = await getBillingStatus(api, user);
        expect(status).toMatchObject({ access_allowed: false, redirect: 'pricing', status: 'expired' });
        expect(status.checkout_price_id).toBeUndefined();

        await logIn(page, user);
        const banner = new BillingBannerPage(page);
        await banner.load();
        await expect(banner.banner).toContainText('Your subscription is inactive.');
        await expect(banner.contactSupportLink).toBeVisible();
        await expect(banner.extendButton).toHaveCount(0);
        await shot('discontinued go banner with contact support');
    });

    test('buying Go while a Go plan is active is rejected', async ({ api, catalog }) => {
        const user = await registerE2EUser(api, 'go-active');
        await setGoPlan(user.tenantId, { priceId: catalog.go.priceId, expiresAt: new Date(Date.now() + DAY_MS) });

        const response = await createCheckoutSession(api, user, catalog.go.priceId);
        expect(response.status).toBe(400);
        expect(response.body).toMatchObject({ _error: 'You already have an active plan' });
    });
});
