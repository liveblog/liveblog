import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html', { open: 'never' }],
        ['junit', { outputFile: '../e2e-test-results/results.xml' }],
    ],
    use: {
        baseURL: 'http://localhost:9000',
        screenshot: 'only-on-failure',
        video: 'off',
        trace: 'on-first-retry',
    },
    globalSetup: './global.setup.ts',
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
