import { expect, Locator, Page } from '@playwright/test';
import { SUCCESS_CARD, TestCard } from './stripe-checkout.page';

const LOAD_TIMEOUT = 60_000;
// Plan changes and cancellations update the subscription before the next
// screen renders, which can take a while in a sandbox.
const SUBMIT_TIMEOUT = 90_000;

export type CancelReason = 'It\'s too expensive' | 'I found an alternative' | 'I no longer need it' | 'Other reason';

/**
 * Stripe Customer Portal (billing.stripe.com), configured by the account's
 * default portal configuration.
 *
 * The portal's buttons carry a hidden "Confirming... Loading" label in their
 * accessible names, so submit buttons are matched by prefix. Plan cards have
 * no test ids; a card is the innermost block holding the product name and a
 * "Select plan" button.
 */
export class StripePortalPage {
    readonly activePlans: Locator;
    readonly outstandingInvoices: Locator;
    readonly heading: Locator;
    readonly returnLink: Locator;

    constructor(private page: Page) {
        this.activePlans = page.getByRole('region', { name: 'Active plans' });
        this.outstandingInvoices = page.getByRole('region', { name: 'Outstanding invoices' });
        this.heading = page.getByRole('main').getByRole('heading', { level: 1 });
        this.returnLink = page.getByRole('link', { name: /^Return to / });
    }

    /** Opens the portal the way a subscriber does: avatar, then "Subscription". */
    static async openFromUserMenu(page: Page): Promise<StripePortalPage> {
        // The link only gets its click handler once its own /billing/status
        // request resolves, and the menu renders it only when opened.
        const linkReady = page.waitForResponse(
            (response) => response.url().includes('/billing/status') && response.request().method() === 'GET',
            { timeout: 30_000 },
        );
        await page.locator('button.current-user').click();
        await linkReady;
        await page.locator('[sd-manage-subscription]').click();

        const portal = new StripePortalPage(page);
        await portal.waitForOverview();
        return portal;
    }

    /** Waits for the portal overview listing the active subscriptions. */
    async waitForOverview() {
        await this.page.waitForURL(/^https:\/\/billing\.stripe\.com\//, { timeout: LOAD_TIMEOUT });
        await expect(this.activePlans).toBeVisible({ timeout: LOAD_TIMEOUT });
    }

    activePlan(productName: string): Locator {
        return this.activePlans.getByRole('link', { name: new RegExp(`^${productName}\\b`) });
    }

    async openPlan(productName: string) {
        await this.activePlan(productName).click();
        await expect(this.heading).toHaveText(productName, { timeout: LOAD_TIMEOUT });
    }

    /** From a plan's page, opens the plan picker. */
    async startPlanUpdate() {
        await this.page.getByRole('link', { name: 'Update plan' }).click();
        await expect(this.heading).toHaveText('Choose your plan', { timeout: LOAD_TIMEOUT });
    }

    planCard(productName: string): Locator {
        return this.page.getByRole('main').locator('div')
            .filter({ has: this.page.getByText(productName, { exact: true }) })
            .filter({ has: this.page.getByRole('button', { name: 'Select plan' }) })
            .last();
    }

    /** From the plan picker, picks `productName` and waits for the change summary. */
    async selectPlan(productName: string) {
        await this.planCard(productName).getByRole('button', { name: 'Select plan' }).click();
        await expect(this.heading).toHaveText('Summary', { timeout: LOAD_TIMEOUT });
    }

    /** Confirms the plan change and waits to land back on the plan's page. */
    async confirmPlanUpdate(productName: string) {
        await this.page.getByRole('main').getByRole('button', { name: /^Confirm/ }).click();
        await expect(this.heading).toHaveText(productName, { timeout: SUBMIT_TIMEOUT });
    }

    /** From a plan's page, opens the cancellation review. */
    async startCancel() {
        await this.page.getByRole('main').getByRole('button', { name: 'Cancel plan', exact: true }).click();
        await expect(this.heading).toHaveText('Review your changes', { timeout: LOAD_TIMEOUT });
    }

    async chooseCancelReason(reason: CancelReason) {
        await this.page.getByRole('button', { name: 'Reason for cancellation (optional)' }).click();
        await this.page.getByRole('option', { name: reason }).click();
        await expect(this.page.getByRole('button', { name: 'Reason for cancellation (optional)' })).toContainText(reason);
    }

    async confirmCancel() {
        await this.page.getByRole('main').getByRole('button', { name: /^Cancel plan/ }).click();
        await expect(this.heading).toHaveText('Plan canceled', { timeout: SUBMIT_TIMEOUT });
    }

    /** Leaves the cancellation confirmation. */
    async done() {
        await this.page.getByRole('main').getByRole('button', { name: 'Done' }).click();
        await expect(this.heading).not.toHaveText('Plan canceled', { timeout: LOAD_TIMEOUT });
    }

    async openWallet() {
        await this.page.getByRole('link', { name: 'Wallet' }).click();
        await expect(this.heading).toHaveText('Wallet', { timeout: LOAD_TIMEOUT });
    }

    /** A card in the wallet's payment method list, e.g. `walletCard('4242')`. */
    walletCard(last4: string): Locator {
        return this.page.getByRole('main').getByRole('listitem').filter({ hasText: `•••• ${last4}` });
    }

    /** From the wallet, opens "Add payment method" and fills in a card, kept as the default. */
    async fillNewCard(card: TestCard = SUCCESS_CARD) {
        await this.page.getByRole('link', { name: 'Add payment method' }).click();
        await expect(this.heading).toHaveText('Add payment method', { timeout: LOAD_TIMEOUT });

        const element = this.page.frameLocator('iframe[src*="elements-inner-payment"]');
        await element.locator('input[name="number"]').fill(card.number, { timeout: LOAD_TIMEOUT });
        await element.locator('input[name="expiry"]').fill(card.expiry);
        await element.locator('input[name="cvc"]').fill(card.cvc);
        // Only some billing countries (geo-IP default) ask for a postal code.
        const postalCode = element.locator('input[name="postalCode"]');
        if (await postalCode.isVisible()) {
            await postalCode.fill(card.postalCode);
        }
        // The Payment Element offers Link sign-up ("Save my information for
        // faster checkout") with the customer's email and name prefilled.
        // While any of it is set, the submit hangs or waits for a phone
        // number. Depending on the geo-IP country the offer is a ticked
        // checkbox (US, as on CI) or optional fields (EU), so both are undone.
        const linkOptIn = element.getByRole('checkbox', { name: 'Save my information for faster checkout' });
        if (await linkOptIn.isChecked({ timeout: 5_000 }).catch(() => false)) {
            await linkOptIn.uncheck();
        }
        for (const prefilled of ['Email', 'Full name']) {
            const field = element.getByRole('textbox', { name: prefilled, exact: true });
            if (await field.isVisible()) {
                await field.clear();
            }
        }
        await expect(this.page.getByRole('checkbox', { name: 'Use as default payment method' })).toBeChecked();
    }

    /** Submits the card filled in by `fillNewCard` and waits to be back on the wallet. */
    async saveNewCard() {
        await this.page.getByRole('main').getByRole('button', { name: /^Add payment method/ }).click();
        await this.page.waitForURL((url) => !url.pathname.includes('add-payment-method'), { timeout: SUBMIT_TIMEOUT });
        await expect(this.heading).toHaveText('Wallet', { timeout: LOAD_TIMEOUT });
    }

    /** Follows the portal's return link back to the session's `return_url` under `origin`. */
    async returnTo(origin: string) {
        await this.returnLink.click();
        await this.page.waitForURL((url) => url.origin === new URL(origin).origin, { timeout: LOAD_TIMEOUT });
    }
}
