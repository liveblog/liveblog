import { BrowserContext, test as base } from '@playwright/test';

export type UiOptions = {
    // set per Playwright project: runs the suite against the refreshed UI
    uiRefresh: boolean;
};

// Keys mirror client/app/scripts/liveblog-ui-refresh/ui-refresh.ts. Written on
// every navigation because an explicit logout wipes localStorage.
export async function applyUiMode(context: BrowserContext, uiRefresh: boolean): Promise<void> {
    await context.addInitScript((enabled: boolean) => {
        try {
            if (enabled) {
                localStorage.setItem('lb:uiRefresh', '1');
            } else {
                localStorage.removeItem('lb:uiRefresh');
            }
            // the opt-in banner floats over the bottom-right corner of every page
            localStorage.setItem('lb:uiRefreshBannerDismissed', '1');
        } catch (e) {
            // opaque origins such as about:blank have no localStorage
        }
    }, uiRefresh);
}

export const test = base.extend<UiOptions>({
    uiRefresh: [false, { option: true }],

    context: async ({ context, uiRefresh }, use) => {
        await applyUiMode(context, uiRefresh);
        await use(context);
    },
});

export { expect } from '@playwright/test';
