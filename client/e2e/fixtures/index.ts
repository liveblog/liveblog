import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { PREPOPULATE_URL } from '../config';

type Fixtures = {
    authenticatedPage: Page;
    resetDb: void;
};

export const test = base.extend<Fixtures>({
    resetDb: [async ({ request }, use) => {
        await request.post(PREPOPULATE_URL, { data: { profile: 'test' }, timeout: 40000 });
        await use();
    }, { auto: true }],

    authenticatedPage: async ({ page }, use) => {
        const login = new LoginPage(page);
        await page.goto('/');
        await login.login('admin', 'admin');
        await login.waitForReady();
        await use(page);
    },
});

export { expect } from '@playwright/test';
