import { test as base } from '@playwright/test';
import { ApiClient } from '../api/client';
import { E2ECatalog, loadCatalog } from '../api/stripe';
import { closeTenantsDb } from '../api/tenants-db';

// Fixtures for the Stripe suite. Unlike fixtures/index.ts there is no
// prepopulate reset: billing specs register their own tenants.
type Fixtures = {
    api: ApiClient;
    catalog: E2ECatalog;
};

type WorkerFixtures = {
    tenantsDb: void;
};

export const test = base.extend<Fixtures, WorkerFixtures>({
    api: async ({ request }, use) => {
        await use(new ApiClient(request));
    },

    // eslint-disable-next-line no-empty-pattern
    catalog: async ({}, use) => {
        await use(loadCatalog());
    },

    // eslint-disable-next-line no-empty-pattern
    tenantsDb: [async ({}, use) => {
        await use();
        await closeTenantsDb();
    }, { scope: 'worker', auto: true }],
});

export { expect } from '@playwright/test';
