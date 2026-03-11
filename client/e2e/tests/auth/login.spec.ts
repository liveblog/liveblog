import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';

test.beforeEach(async ({ page }) => {
    await page.goto('/');
});

test('login form is visible on load', async ({ page }) => {
    const login = new LoginPage(page);
    await expect(login.loginButton).toBeVisible();
});

test('user can log in', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login('admin', 'admin');
    await login.waitForReady();

    await expect(page).toHaveURL(/#\/liveblog/);
    await expect(login.loginButton).not.toBeVisible();
});

test('logged-in user display name is correct', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login('admin', 'admin');
    await login.waitForReady();

    await page.locator('button.current-user').click();
    await expect(login.displayName).toHaveText('admin');
});

test('user can log out', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login('admin', 'admin');
    await login.waitForReady();
    await login.logout();

    await expect(login.loginButton).toBeVisible();
});

test('invalid credentials show an error', async ({ page }) => {
    const login = new LoginPage(page);
    await login.login('foo', 'bar');

    await expect(login.errorMessage).toBeVisible();
    await expect(login.loginButton).toBeVisible();
    await expect(page).not.toHaveURL(/#\/liveblog/);
});
