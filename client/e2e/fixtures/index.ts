import { test as base, Page } from '@playwright/test';

type Fixtures = {
    authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
    authenticatedPage: async ({ page }, use) => {
        await page.goto('/');
        await page.locator('[ng-model="username"]').fill('admin');
        await page.locator('[ng-model="password"]').fill('admin');
        await page.locator('#login-btn').click();
        await page.waitForFunction(() => (window as Window & { superdeskIsReady?: boolean }).superdeskIsReady === true);
        await use(page);
    },
});

export { expect } from '@playwright/test';
