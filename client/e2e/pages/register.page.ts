import { Page } from '@playwright/test';

export interface RegistrationForm {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    password: string;
    organizationName?: string;
}

/**
 * Public sign-up page. With `?price_id=` it shows the plan and, after
 * registering and logging in, sends the browser to Stripe Checkout.
 */
export class RegisterPage {
    constructor(private page: Page) {}

    async open(priceId?: string) {
        const query = priceId ? `?price_id=${encodeURIComponent(priceId)}` : '';
        await this.page.goto(`/register.html${query}`);
        await this.page.locator('#firstName').waitFor();
    }

    async register(form: RegistrationForm) {
        await this.page.locator('#firstName').fill(form.firstName);
        await this.page.locator('#lastName').fill(form.lastName);
        if (form.organizationName) {
            await this.page.locator('#organizationName').fill(form.organizationName);
        }
        await this.page.locator('#email').fill(form.email);
        await this.page.locator('#username').fill(form.username);
        await this.page.locator('#password').fill(form.password);
        await this.page.locator('button[type="submit"]').click();
    }
}
