import { BrowserContext, test as base } from '@playwright/test';

export type UiOptions = {
    // set per Playwright project: runs the suite against the refreshed UI
    uiRefresh: boolean;
};

// Cookie names mirror client/app/scripts/liveblog-ui-refresh/ui-refresh.ts.
export async function applyUiMode(context: BrowserContext, uiRefresh: boolean, baseURL?: string): Promise<void> {
    if (!baseURL) {
        throw new Error('the UI mode cookies need `baseURL` set in playwright.config.ts');
    }

    const cookies = [
        // the opt-in banner floats over the bottom-right corner of every page
        { name: 'lb_ui_refresh_banner_dismissed', value: '1', url: baseURL },
    ];

    if (uiRefresh) {
        cookies.push({ name: 'lb_ui_refresh', value: '1', url: baseURL });
    }

    await context.addCookies(cookies);
}

export const test = base.extend<UiOptions>({
    uiRefresh: [false, { option: true }],

    context: async ({ context, uiRefresh, baseURL }, use) => {
        await applyUiMode(context, uiRefresh, baseURL);
        await use(context);
    },
});

export { expect } from '@playwright/test';
