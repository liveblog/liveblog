import { assertPortalConfig, ensureCatalog, writeCatalog } from './api/stripe';

async function stripeGlobalSetup() {
    const catalog = await ensureCatalog();
    writeCatalog(catalog);
    await assertPortalConfig(catalog);
}

export default stripeGlobalSetup;
