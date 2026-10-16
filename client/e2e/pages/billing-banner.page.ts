import { expect, Locator, Page, Request, Response } from '@playwright/test';
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
        // The banner also refreshes on login, so a request from before the
        // navigation can still be in flight, and its body is gone once the
        // navigation commits. Only requests made from here on count, and one
        // whose body cannot be read is skipped.
        const requests = new Set<Request>();
        const responses: Response[] = [];
        const onRequest = (request: Request) => {
            if (request.url().includes('/billing/status') && request.method() === 'GET') {
                requests.add(request);
            }
        };
        const onResponse = (response: Response) => {
            if (requests.has(response.request())) {
                responses.push(response);
            }
        };
        this.page.on('request', onRequest);
        this.page.on('response', onResponse);
        try {
            if (path === undefined) {
                await this.page.reload();
            } else {
                await this.page.goto(path);
            }
            for (let next = 0; ; next++) {
                await expect.poll(() => responses.length, {
                    timeout: 60_000,
                    message: 'the banner never got a readable /billing/status response',
                }).toBeGreaterThan(next);
                try {
                    return await responses[next].json() as BillingStatus;
                } catch {
                    // Answered while the navigation was committing.
                }
            }
        } finally {
            this.page.off('request', onRequest);
            this.page.off('response', onResponse);
        }
    }
}
