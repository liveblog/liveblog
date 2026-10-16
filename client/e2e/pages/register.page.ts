import { Locator, Page } from '@playwright/test';

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
    readonly termsCheckbox: Locator;
    readonly termsOfUseLink: Locator;
    readonly privacyPolicyLink: Locator;
    readonly submitButton: Locator;

    constructor(private page: Page) {
        this.termsCheckbox = page.locator('#termsAccepted');
        this.termsOfUseLink = page.getByRole('link', { name: 'Terms of Use' });
        this.privacyPolicyLink = page.getByRole('link', { name: 'Privacy Policy' });
        this.submitButton = page.locator('button[type="submit"]');
    }

    async open(priceId?: string) {
        const query = priceId ? `?price_id=${encodeURIComponent(priceId)}` : '';
        await this.page.goto(`/register.html${query}`);
        await this.page.locator('#firstName').waitFor();
    }

    /** Fills every field but leaves the terms checkbox alone. */
    async fill(form: RegistrationForm) {
        await this.page.locator('#firstName').fill(form.firstName);
        await this.page.locator('#lastName').fill(form.lastName);
        if (form.organizationName) {
            await this.page.locator('#organizationName').fill(form.organizationName);
        }
        await this.page.locator('#email').fill(form.email);
        await this.page.locator('#username').fill(form.username);
        await this.page.locator('#password').fill(form.password);
    }

    async register(form: RegistrationForm) {
        await this.fill(form);
        await this.termsCheckbox.check();
        await this.submitButton.click();
    }
}
