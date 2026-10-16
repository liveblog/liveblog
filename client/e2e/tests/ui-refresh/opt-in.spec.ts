import { BrowserContext, Page } from '@playwright/test';
import { test, expect } from '../../fixtures';
import { PERSONAS } from '../../api/client';
import { LoginPage } from '../../pages/login.page';

// The shared fixtures pin the UI mode and hide the banner through cookies,
// so these specs drive a bare context to exercise the real opt-in flow.
test.describe('refreshed UI opt-in', () => {
    test.skip(({ uiRefresh }) => uiRefresh, 'covers the flow from the classic UI only');

    let context: BrowserContext;
    let page: Page;

    test.beforeEach(async ({ browser }) => {
        context = await browser.newContext();
        page = await context.newPage();
        await new LoginPage(page).signIn(PERSONAS.admin.username, PERSONAS.admin.password);
    });

    test.afterEach(async () => {
        await context.close();
    });

    test('banner switches to the refreshed UI and the Help menu switches back', async () => {
        const html = page.locator('html');
        const banner = page.getByTestId('ui-refresh-banner');

        await expect(banner).toBeVisible();
        await expect(html).not.toHaveClass(/\blb-refresh\b/);

        await page.getByTestId('ui-refresh-try').click();
        await expect(html).toHaveClass(/\blb-refresh\b/);
        await expect(banner).toBeHidden();

        await page.reload();
        await expect(html).toHaveClass(/\blb-refresh\b/);

        await page.locator('.liveblog-help .dropdown__toggle').click();
        await page.getByTestId('ui-refresh-toggle').click();
        await expect(html).not.toHaveClass(/\blb-refresh\b/);
        await expect(banner).toBeHidden();
    });

    test('the choice survives signing out', async () => {
        const login = new LoginPage(page);

        await page.getByTestId('ui-refresh-try').click();
        await login.logout();
        await expect(login.loginButton).toBeVisible();
        await login.signIn(PERSONAS.admin.username, PERSONAS.admin.password);

        await expect(page.locator('html')).toHaveClass(/\blb-refresh\b/);
        await expect(page.getByTestId('ui-refresh-banner')).toBeHidden();
    });

    test('dismissing the banner keeps the classic UI and hides it for good', async () => {
        const banner = page.getByTestId('ui-refresh-banner');

        await page.getByTestId('ui-refresh-dismiss').click();
        await expect(banner).toBeHidden();

        await page.reload();
        await expect(page.locator('button.current-user')).toBeVisible();
        await expect(banner).toBeHidden();
        await expect(page.locator('html')).not.toHaveClass(/\blb-refresh\b/);
    });
});
