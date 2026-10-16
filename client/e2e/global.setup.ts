import { request } from '@playwright/test';
import { ApiClient } from './api/client';

async function globalSetup() {
    const apiContext = await request.newContext();

    try {
        await new ApiClient(apiContext).prepopulate();
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
