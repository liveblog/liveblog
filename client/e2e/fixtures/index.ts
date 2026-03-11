import { test as base, Page } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

type Fixtures = {
    authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
    authenticatedPage: async ({ page }, use) => {
        const login = new LoginPage(page);
        await page.goto('/');
        await login.login('admin', 'admin');
        await login.waitForReady();
        await use(page);
    },
});

export { expect } from '@playwright/test';
