import { cleanupTracked } from './api/stripe';

async function stripeGlobalTeardown() {
    const result = await cleanupTracked();
    console.log(`[stripe teardown] deleted ${result.deletedTestClocks.length} test clock(s), ${result.deletedCustomers.length} customer(s)`);
    if (result.errors.length) {
        // Leftovers are swept by `npm run stripe:janitor`, so a failed delete
        // should not fail an otherwise green run.
        console.warn(`[stripe teardown] cleanup errors:\n${result.errors.join('\n')}`);
    }
}

export default stripeGlobalTeardown;
