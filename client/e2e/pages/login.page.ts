import { Page, Locator } from '@playwright/test';

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

    async logout() {
        await this.page.locator('button.current-user').click();
        await this.page.getByRole('button', { name: 'SIGN OUT' }).click();
    }
}
