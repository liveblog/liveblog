import { parseArgs } from 'util';
import { janitor } from '../api/stripe';

// Usage: npm run stripe:janitor -- [--dry-run] [--older-than-hours N]
const { values } = parseArgs({
    options: {
        'dry-run': { type: 'boolean', default: false },
        'older-than-hours': { type: 'string', default: '24' },
    },
});

const olderThanHours = Number(values['older-than-hours']);
if (!Number.isFinite(olderThanHours) || olderThanHours < 0) {
    console.error('--older-than-hours must be a non-negative number');
    process.exit(1);
}
const dryRun = values['dry-run'] ?? false;

janitor({ olderThanHours, dryRun })
    .then((result) => {
        const verb = dryRun ? 'would delete' : 'deleted';
        console.log(`${verb} ${result.deletedTestClocks.length} test clock(s): ${result.deletedTestClocks.join(' ') || '-'}`);
        console.log(`${verb} ${result.deletedCustomers.length} customer(s): ${result.deletedCustomers.join(' ') || '-'}`);
        if (result.errors.length) {
            console.error(`errors:\n${result.errors.join('\n')}`);
            process.exit(1);
        }
    })
    .catch((err: Error) => {
        console.error(`stripe:janitor failed: ${err.message}`);
        process.exit(1);
    });
