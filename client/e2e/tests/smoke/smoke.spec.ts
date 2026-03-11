import { test, expect } from '@playwright/test';

test('app loads and login form is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#login-btn')).toBeVisible();
});

test('authenticated page loads', async ({ page }) => {
    await page.goto('/');
    await page.locator('[ng-model="username"]').fill('admin');
    await page.locator('[ng-model="password"]').fill('admin');
    await page.locator('#login-btn').click();
    await page.waitForFunction(() => (window as Window & { superdeskIsReady?: boolean }).superdeskIsReady === true);
    await expect(page).toHaveURL(/#\/liveblog/);
});
