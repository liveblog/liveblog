import { ensureCatalog, writeCatalog } from './api/stripe';

async function stripeGlobalSetup() {
    const catalog = await ensureCatalog();
    writeCatalog(catalog);
}

export default stripeGlobalSetup;
