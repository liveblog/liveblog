import { defineConfig, devices } from '@playwright/test';

// Stripe sandbox suite. Runs against a real Stripe sandbox with billing
// enabled, so it is kept out of the default config and its prepopulate setup.
export default defineConfig({
    testDir: './tests/billing',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report-stripe' }]],
    use: {
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:9055',
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'retain-on-failure',
    },
    globalSetup: './stripe.setup.ts',
    globalTeardown: './stripe.teardown.ts',
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
