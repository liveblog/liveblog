import { Locator, Page } from '@playwright/test';
import { BillingStatus } from '../api/billing';

/**
 * The app-wide billing banner. It reads /billing/status asynchronously (on
 * boot, login, logout and blocked writes), so `load` waits for that request to
 * settle before specs assert the banner's presence or absence.
 */
export class BillingBannerPage {
    readonly banner: Locator;
    readonly extendButton: Locator;
    readonly updateBillingButton: Locator;
    readonly contactSupportLink: Locator;

    constructor(private page: Page) {
        this.banner = page.locator('.billing-banner');
        this.extendButton = this.banner.getByRole('button', { name: 'Extend' });
        this.updateBillingButton = this.banner.getByRole('button', { name: 'Update Billing' });
        this.contactSupportLink = this.banner.getByRole('link', { name: 'Contact Support' });
    }

    /** Navigates to `path` (default: reloads) and returns the status the banner rendered from. */
    async load(path?: string): Promise<BillingStatus> {
        const statusResponse = this.page.waitForResponse(
            (response) => response.url().includes('/billing/status') && response.request().method() === 'GET',
            { timeout: 60_000 },
        );
        if (path === undefined) {
            await this.page.reload();
        } else {
            await this.page.goto(path);
        }
        const response = await statusResponse;
        return await response.json() as BillingStatus;
    }
}
