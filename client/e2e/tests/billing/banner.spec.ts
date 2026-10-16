import { Page } from '@playwright/test';
import { test, expect } from '../../fixtures/billing';
import { registerE2EUser } from '../../api/billing';
import { expireGoPlan, setGoPlan } from '../../api/tenants-db';
import { BillingBannerPage } from '../../pages/billing-banner.page';
import { LoginPage } from '../../pages/login.page';

// The banner must follow the session without page reloads: the app shell (and
// the banner with it) boots before login, and logging in or out does not
// reload the page.

const DAY_MS = 24 * 60 * 60 * 1000;

// A write sent through the app's own $http, so it passes the billing interceptor
// the way a blocked click in the UI would.
async function writeThroughApp(page: Page): Promise<number> {
    return page.evaluate(async () => {
        const injector = (window as any).angular.element(document.body).injector();
        const $http = injector.get('$http');
        const url = `${injector.get('config').server.url}/blogs`;

        try {
            const response = await $http.post(url, { title: `e2e banner probe ${Date.now()}` });
            return response.status;
        } catch (rejection) {
            return (rejection as { status: number }).status;
        }
    });
}

test.describe('Billing banner', () => {
    test('shows the expired plan banner right after logging in', async ({ page, api, catalog, shot }) => {
        const user = await registerE2EUser(api, 'banner-login');
        await setGoPlan(user.tenantId, { priceId: catalog.go.priceId, expiresAt: new Date(Date.now() + DAY_MS) });
        await expireGoPlan(user.tenantId);

        await new LoginPage(page).signIn(user.username, user.password);

        const banner = new BillingBannerPage(page);
        await expect(banner.banner).toContainText('Your plan has expired.');
        await expect(banner.extendButton).toBeVisible();
        await shot('expired banner after login without reload');
    });

    test('shows the banner when a write is blocked mid-session and clears it on logout', async ({ page, api, catalog, shot }) => {
        const user = await registerE2EUser(api, 'banner-midsession');
        await setGoPlan(user.tenantId, { priceId: catalog.go.priceId, expiresAt: new Date(Date.now() + DAY_MS) });

        const login = new LoginPage(page);
        await login.signIn(user.username, user.password);

        const banner = new BillingBannerPage(page);
        await expect(banner.banner).toHaveCount(0);

        await expireGoPlan(user.tenantId);
        expect(await writeThroughApp(page)).toBe(403);

        await expect(banner.banner).toContainText('Your plan has expired.');
        await expect(banner.extendButton).toBeVisible();
        await shot('expired banner after a blocked write');

        await login.logout();
        await expect(page.locator('#login-username')).toBeVisible();
        await expect(banner.banner).toHaveCount(0);
    });
});
