import { expect, Page, Locator } from '@playwright/test';

export class LoginPage {
    readonly loginButton: Locator;
    readonly errorMessage: Locator;
    readonly displayName: Locator;

    constructor(private page: Page) {
        this.loginButton = page.locator('#login-btn');
        this.errorMessage = page.locator('p.error');
        this.displayName = page.locator('.user-info .displayname');
    }

    async login(username: string, password: string) {
        await this.page.locator('#login-username').fill(username);
        await this.page.locator('#login-password').fill(password);
        await this.loginButton.click();
    }

    async waitForReady() {
        await this.page.waitForFunction(
            () => (window as Window & { superdeskIsReady?: boolean }).superdeskIsReady === true
        );
    }

    /** Opens the app, logs in and waits until the session is up. */
    async signIn(username: string, password: string) {
        await this.page.goto('/');
        await this.login(username, password);
        await this.waitForSession();
    }

    /**
     * Waits for a logged-in app. superdeskIsReady and the top bar are already
     * there behind the login form, so neither proves the session is up.
     */
    async waitForSession() {
        await this.page.waitForFunction(() => !!localStorage.getItem('sess:token'), undefined, { timeout: 60_000 });
        await expect(this.page.locator('#login-username')).toBeHidden({ timeout: 60_000 });
        await expect(this.page.locator('button.current-user')).toBeVisible();
    }

    async logout() {
        await this.page.locator('button.current-user').click();
        await this.page.getByRole('button', { name: 'SIGN OUT' }).click();
    }
}
