import { expect, Locator, Page } from '@playwright/test';

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
 * The card form is collapsed behind a "Card" option next to Klarna and
 * friends, the currency defaults to the geo-IP one (adaptive pricing), and
 * a "Save my information for faster checkout" box would enrol the payer in
 * Link. Specs should assert on product names, not on amounts in the
 * adaptive currency.
 */
export class StripeCheckoutPage {
    readonly submitButton: Locator;
    readonly cardOption: Locator;
    readonly cardNumber: Locator;
    readonly saveInfoCheckbox: Locator;

    constructor(private page: Page) {
        this.submitButton = page.getByTestId('hosted-payment-submit-button');
        this.cardOption = page.locator('#payment-method-label-card');
        this.cardNumber = page.locator('#cardNumber');
        this.saveInfoCheckbox = page.locator('#enableStripePass');
    }

    /** Waits for the hosted page to show `productName` and a usable submit button. */
    async waitForLoaded(productName: string) {
        await this.page.waitForURL(/^https:\/\/checkout\.stripe\.com\//, { timeout: LOAD_TIMEOUT });
        await expect(this.page.getByText(productName, { exact: true }).first()).toBeVisible({ timeout: LOAD_TIMEOUT });
        await expect(this.submitButton).toBeVisible({ timeout: LOAD_TIMEOUT });
        await expect(this.submitButton).toHaveText(/Pay|Subscribe/);
    }

    async selectCard() {
        // With card as the only method Stripe renders the card form directly.
        if (!await this.cardNumber.isVisible()) {
            // The "Card" radio is decorative and the accordion button laid
            // over the row is transparent, which Playwright treats as not
            // visible. Forcing the click on the label lands on that button.
            await this.cardOption.click({ force: true });
        }
        await expect(this.cardNumber).toBeVisible({ timeout: 30_000 });
    }

    async fillCard(card: TestCard = SUCCESS_CARD) {
        await this.cardNumber.fill(card.number);
        await this.page.locator('#cardExpiry').fill(card.expiry);
        await this.page.locator('#cardCvc').fill(card.cvc);
        await this.page.locator('#billingName').fill(card.name);

        // Only some billing countries ask for a postal code.
        const postalCode = this.page.locator('#billingPostalCode');
        if (await postalCode.isVisible()) {
            await postalCode.fill(card.postalCode);
        }

        if (await this.saveInfoCheckbox.isChecked().catch(() => false)) {
            await this.saveInfoCheckbox.uncheck();
        }
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
