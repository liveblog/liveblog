import { request } from '@playwright/test';
import { PREPOPULATE_URL } from './config';

async function globalSetup() {
    const apiContext = await request.newContext();

    try {
        const response = await apiContext.post(PREPOPULATE_URL, {
            data: { profile: 'test' },
            timeout: 40000,
        });

        if (!response.ok()) {
            throw new Error(`prepopulate returned ${response.status()}`);
        }
    } catch (err) {
        if (process.env.CI) {
            throw err;
        }
        console.warn(`[global setup] prepopulate skipped: ${(err as Error).message}`);
    } finally {
        await apiContext.dispose();
    }
}

export default globalSetup;
