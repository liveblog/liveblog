import { expect, FrameLocator, Locator, Page } from '@playwright/test';

export interface TestCard {
    number: string;
    expiry: string;
    cvc: string;
    name: string;
    postalCode: string;
}

export const SUCCESS_CARD: TestCard = {
    number: '4242424242424242',
    expiry: '12 / 34',
    cvc: '123',
    name: 'E2E Tester',
    postalCode: '10115',
};

// Stripe hosted pages can be slow, especially the first load and the
// redirect after paying.
const LOAD_TIMEOUT = 60_000;
const RETURN_TIMEOUT = 90_000;

/**
 * Stripe hosted Checkout (checkout.stripe.com), paying by card.
 *
 * The payment form, Pay button included, lives in an iframe titled "Secure
 * embedded form frame". The card form is collapsed behind a "Card" option
 * next to Klarna and friends, the currency defaults to the geo-IP one
 * (adaptive pricing), and a "Save my information for faster checkout" box
 * would enrol the payer in Link. Specs should assert on product names, not
 * on amounts in the adaptive currency.
 */
export class StripeCheckoutPage {
    readonly form: FrameLocator;
    readonly currencySelector: FrameLocator;
    readonly submitButton: Locator;
    readonly cardOption: Locator;
    readonly cardNumber: Locator;
    readonly saveInfoCheckbox: Locator;

    constructor(private page: Page) {
        this.form = page.frameLocator('iframe[title="Secure embedded form frame"]');
        this.currencySelector = page.frameLocator('iframe[title="Secure currency selector"]');
        // "Pay securely with Link" is also a button, so match the form's submit by type.
        this.submitButton = this.form.locator('button[type="submit"]');
        this.cardOption = this.form.getByText('Card', { exact: true });
        this.cardNumber = this.form.getByLabel('Card number');
        this.saveInfoCheckbox = this.form.getByLabel('Save my information for faster checkout');
    }

    /** Waits for the hosted page to show `productName` and a usable submit button. */
    async waitForLoaded(productName: string) {
        await this.page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: LOAD_TIMEOUT });
        await expect(this.page.getByText(productName, { exact: true }).first()).toBeVisible({ timeout: LOAD_TIMEOUT });
        await expect(this.submitButton).toBeVisible({ timeout: LOAD_TIMEOUT });
    }

    async selectCard() {
        // With card as the only method Stripe renders the card form directly.
        if (!await this.cardNumber.isVisible()) {
            await this.cardOption.click();
        }
        await expect(this.cardNumber).toBeVisible({ timeout: 30_000 });
    }

    async fillCard(card: TestCard = SUCCESS_CARD) {
        await this.cardNumber.fill(card.number);
        await this.form.getByLabel('Expiration (MM/YY)').fill(card.expiry);
        await this.form.getByLabel('Security code').fill(card.cvc);
        await this.form.getByLabel('Name on card').fill(card.name);

        // Only some billing countries ask for a postal code.
        const postalCode = this.form.getByLabel(/^(ZIP|Postal code)/);
        if (await postalCode.isVisible()) {
            await postalCode.fill(card.postalCode);
        }

        if (await this.saveInfoCheckbox.isChecked().catch(() => false)) {
            await this.saveInfoCheckbox.uncheck();
        }
    }

    /**
     * How often `text` appears as an amount: as the line item price or, with
     * adaptive pricing, in the currency chooser's iframe.
     */
    async amountCount(text: string): Promise<number> {
        return await this.page.getByText(text).count() + await this.currencySelector.getByText(text).count();
    }

    async submit() {
        await this.submitButton.click();
    }

    /** Selects card, fills it in and submits. Call `waitForLoaded` first. */
    async payWithCard(card: TestCard = SUCCESS_CARD) {
        await this.selectCard();
        await this.fillCard(card);
        await this.submit();
    }

    /** Waits for Stripe to redirect to the session's success URL under `origin`. */
    async waitForReturn(origin: string) {
        await this.page.waitForURL((url) => url.origin === new URL(origin).origin, { timeout: RETURN_TIMEOUT });
    }
}
