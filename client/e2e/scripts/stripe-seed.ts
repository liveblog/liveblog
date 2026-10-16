import { ensureCatalog } from '../api/stripe';

ensureCatalog()
    .then((catalog) => console.log(JSON.stringify(catalog, null, 2)))
    .catch((err: Error) => {
        console.error(`stripe:seed failed: ${err.message}`);
        process.exit(1);
    });
