import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { ApiClient, Credentials, PERSONAS } from '../api/client';

type Fixtures = {
    api: ApiClient;
    authenticatedPage: Page;
    contributorPage: Page;
    supportPage: Page;
    resetDb: void;
};

async function loginAs(page: Page, credentials: Credentials): Promise<void> {
    const login = new LoginPage(page);
    await page.goto('/');
    await login.login(credentials.username, credentials.password);
    await login.waitForReady();
}

export const test = base.extend<Fixtures>({
    // Fresh client per test, so cached auth tokens never outlive the DB reset.
    api: async ({ request }, use) => {
        await use(new ApiClient(request));
    },

    resetDb: [async ({ api }, use) => {
        await api.prepopulate();
        await use();
    }, { auto: true }],

    authenticatedPage: async ({ page }, use) => {
        await loginAs(page, PERSONAS.admin);
        await use(page);
    },

    // The support user comes from the prepopulate test profile; is_support
    // cannot be granted over REST (CLI or prepopulate only).
    supportPage: async ({ page }, use) => {
        await loginAs(page, PERSONAS.support);
        await use(page);
    },

    contributorPage: async ({ browser }, use) => {
        const ctx = await browser.newContext();
        const page = await ctx.newPage();
        await loginAs(page, PERSONAS.contributor);
        await use(page);
        await ctx.close();
    },
});

export { expect } from '@playwright/test';
