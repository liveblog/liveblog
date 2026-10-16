import fs from 'fs';
import path from 'path';
import { test as base, Page } from '@playwright/test';
import { ApiClient } from '../api/client';
import { E2ECatalog, loadCatalog } from '../api/stripe';
import { closeTenantsDb } from '../api/tenants-db';

/**
 * Takes a full-page screenshot, attaches it to the test report under
 * `NN-name.png` (numbered in call order) and, when STRIPE_E2E_SHOTS_DIR is
 * set, also copies it there as `<test title>--NN-name.png`.
 */
export type Shot = (name: string, target?: Page) => Promise<void>;

// Fixtures for the Stripe suite. Unlike fixtures/index.ts there is no
// prepopulate reset: billing specs register their own tenants.
type Fixtures = {
    api: ApiClient;
    catalog: E2ECatalog;
    shot: Shot;
};

type WorkerFixtures = {
    tenantsDb: void;
};

function slug(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const test = base.extend<Fixtures, WorkerFixtures>({
    api: async ({ request }, use) => {
        await use(new ApiClient(request));
    },

    // eslint-disable-next-line no-empty-pattern
    catalog: async ({}, use) => {
        await use(loadCatalog());
    },

    shot: async ({ page }, use, testInfo) => {
        const copyDir = process.env.STRIPE_E2E_SHOTS_DIR;
        let count = 0;

        await use(async (name, target = page) => {
            count += 1;
            const file = `${String(count).padStart(2, '0')}-${slug(name)}.png`;
            const filePath = testInfo.outputPath(file);
            await target.screenshot({ path: filePath, fullPage: true });
            await testInfo.attach(file, { path: filePath, contentType: 'image/png' });
            if (copyDir) {
                fs.mkdirSync(copyDir, { recursive: true });
                fs.copyFileSync(filePath, path.join(copyDir, `${slug(testInfo.title)}--${file}`));
            }
        });
    },

    // eslint-disable-next-line no-empty-pattern
    tenantsDb: [async ({}, use) => {
        await use();
        await closeTenantsDb();
    }, { scope: 'worker', auto: true }],
});

export { expect } from '@playwright/test';
