import { randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';

// Run artifacts live in Playwright's output dir, which Playwright empties
// before global setup, so a crashed run's tracking file is gone by the next
// run. The janitor covers those leftovers.
const RESULTS_DIR = path.resolve(__dirname, '..', 'test-results');
export const CATALOG_FILE = path.join(RESULTS_DIR, 'stripe-catalog.json');
export const TRACKED_FILE = path.join(RESULTS_DIR, 'stripe-tracked.jsonl');

export const E2E_EMAIL_PATTERN = /^e2e\+[^@]+@example\.com$/i;

let client: Stripe | undefined;

export function stripe(): Stripe {
    if (!client) {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not set. Load the sandbox env before running the Stripe e2e helpers.');
        }
        if (!key.startsWith('sk_test_') && !key.startsWith('rk_test_')) {
            throw new Error('STRIPE_SECRET_KEY is not a test mode key. The Stripe e2e helpers only run against a sandbox.');
        }
        client = new Stripe(key, { maxNetworkRetries: 2 });
    }
    return client;
}

export function e2eEmail(tag = 'user'): string {
    const unique = `${Date.now().toString(36)}${randomBytes(2).toString('hex')}`;
    return `e2e+${tag}-${unique}@example.com`;
}

// Catalog

export interface E2ECatalog {
    go: { productId: string; priceId: string; legacyPriceId: string };
    goDiscontinued: { productId: string; priceId: string };
    solo: { productId: string; monthlyPriceId: string };
    team: { productId: string; monthlyPriceId: string };
}

interface PriceSpec {
    lookupKey: string;
    unitAmount: number;
    monthly?: boolean;
    archived?: boolean;
    isDefault?: boolean;
}

interface ProductSpec {
    // Explicit product ids make product lookup idempotent without Search.
    id: string;
    name: string;
    metadata: Record<string, string>;
    prices: PriceSpec[];
}

const GO_METADATA = { subscription_level: 'liveblog-go', plan_duration_days: '3' };

const CATALOG_SPEC: Record<keyof E2ECatalog, ProductSpec> = {
    go: {
        id: 'e2e_liveblog_go',
        name: 'E2E LiveBlog Go',
        metadata: GO_METADATA,
        prices: [
            { lookupKey: 'e2e_go', unitAmount: 300, isDefault: true },
            { lookupKey: 'e2e_go_legacy', unitAmount: 200, archived: true },
        ],
    },
    goDiscontinued: {
        id: 'e2e_liveblog_go_discontinued',
        name: 'E2E LiveBlog Go Discontinued',
        metadata: GO_METADATA,
        prices: [{ lookupKey: 'e2e_go_discontinued', unitAmount: 250, archived: true }],
    },
    solo: {
        id: 'e2e_liveblog_solo',
        name: 'E2E LiveBlog Solo',
        metadata: { subscription_level: 'solo' },
        prices: [{ lookupKey: 'e2e_solo_monthly', unitAmount: 500, monthly: true, isDefault: true }],
    },
    team: {
        id: 'e2e_liveblog_team',
        name: 'E2E LiveBlog Team',
        metadata: { subscription_level: 'team' },
        prices: [{ lookupKey: 'e2e_team_monthly', unitAmount: 900, monthly: true, isDefault: true }],
    },
};

function isStripeError(err: unknown, code: string): boolean {
    return typeof err === 'object' && err !== null && (err as { code?: string }).code === code;
}

async function ensureProduct(spec: ProductSpec): Promise<Stripe.Product> {
    const metadata = { ...spec.metadata, e2e: 'true' };
    try {
        return await stripe().products.update(spec.id, { name: spec.name, metadata, active: true });
    } catch (err) {
        if (!isStripeError(err, 'resource_missing')) {
            throw err;
        }
    }
    try {
        return await stripe().products.create({ id: spec.id, name: spec.name, metadata });
    } catch (err) {
        // A concurrent seed created it first.
        if (isStripeError(err, 'resource_already_exists')) {
            return stripe().products.retrieve(spec.id);
        }
        throw err;
    }
}

// With `active` omitted, a lookup_keys listing returns archived prices too
// (archiving keeps the lookup_key). Passing `active: true` would hide the
// archived e2e prices and make every seed create duplicates.
async function listPricesByLookupKey(keys: string[]): Promise<Map<string, Stripe.Price>> {
    const page = await stripe().prices.list({ lookup_keys: keys, limit: 100 });
    return new Map(page.data.filter((p) => p.lookup_key).map((p) => [p.lookup_key as string, p]));
}

function productIdOf(price: Stripe.Price): string {
    return typeof price.product === 'string' ? price.product : price.product.id;
}

async function ensurePrice(
    product: Stripe.Product,
    spec: PriceSpec,
    existing: Stripe.Price | undefined,
): Promise<Stripe.Price> {
    if (existing) {
        if (productIdOf(existing) !== product.id) {
            throw new Error(`price ${existing.id} with lookup_key ${spec.lookupKey} belongs to ${productIdOf(existing)}, expected ${product.id}`);
        }
        return existing;
    }
    return stripe().prices.create({
        product: product.id,
        currency: 'eur',
        unit_amount: spec.unitAmount,
        lookup_key: spec.lookupKey,
        nickname: spec.lookupKey,
        metadata: { e2e: 'true' },
        ...(spec.monthly ? { recurring: { interval: 'month' as const } } : {}),
    });
}

/**
 * Creates or reuses the e2e products and prices. Idempotent: products are
 * found by their fixed id, prices by lookup_key. Only touches `e2e_` objects.
 */
export async function ensureCatalog(): Promise<E2ECatalog> {
    const allKeys = Object.values(CATALOG_SPEC).flatMap((p) => p.prices.map((price) => price.lookupKey));
    const existing = await listPricesByLookupKey(allKeys);
    const ids: Record<string, string> = {};

    for (const spec of Object.values(CATALOG_SPEC)) {
        const product = await ensureProduct(spec);
        const defaultSpec = spec.prices.find((p) => p.isDefault);

        for (const priceSpec of spec.prices) {
            const price = await ensurePrice(product, priceSpec, existing.get(priceSpec.lookupKey));
            ids[priceSpec.lookupKey] = price.id;

            if (priceSpec.isDefault && !price.active) {
                await stripe().prices.update(price.id, { active: true });
            }
        }

        const currentDefault = typeof product.default_price === 'string'
            ? product.default_price
            : product.default_price?.id ?? null;
        const wantedDefault = defaultSpec ? ids[defaultSpec.lookupKey] : null;
        if (currentDefault !== wantedDefault) {
            // An empty string unsets the default price.
            await stripe().products.update(product.id, { default_price: wantedDefault ?? '' });
        }

        // Stripe refuses to archive a product's default price, so archiving
        // happens after the default has been settled.
        for (const priceSpec of spec.prices) {
            const price = existing.get(priceSpec.lookupKey);
            if (priceSpec.archived && (!price || price.active)) {
                await stripe().prices.update(ids[priceSpec.lookupKey], { active: false });
            }
        }
    }

    return {
        go: {
            productId: CATALOG_SPEC.go.id,
            priceId: ids.e2e_go,
            legacyPriceId: ids.e2e_go_legacy,
        },
        goDiscontinued: {
            productId: CATALOG_SPEC.goDiscontinued.id,
            priceId: ids.e2e_go_discontinued,
        },
        solo: { productId: CATALOG_SPEC.solo.id, monthlyPriceId: ids.e2e_solo_monthly },
        team: { productId: CATALOG_SPEC.team.id, monthlyPriceId: ids.e2e_team_monthly },
    };
}

/**
 * Fails fast unless the sandbox's default Customer Portal configuration (the
 * one `/billing/portal` sessions get, since they pass no `configuration`)
 * lets subscribers switch between the e2e Solo and Team monthly prices.
 * Read-only: the configuration mirrors production and is managed by hand.
 */
export async function assertPortalConfig(catalog: E2ECatalog): Promise<void> {
    const configs = await stripe().billingPortal.configurations.list({
        is_default: true,
        limit: 1,
        expand: ['data.features.subscription_update.products'],
    });
    const config = configs.data[0];
    if (!config) {
        throw new Error('The Stripe sandbox has no default Customer Portal configuration. Save one in the Dashboard (Settings, Billing, Customer portal).');
    }

    const update = config.features.subscription_update;
    if (!update.enabled) {
        throw new Error(`Customer Portal configuration ${config.id} does not allow subscription updates. Enable "Customers can switch plans" in the sandbox Dashboard.`);
    }

    const allowedPrices = new Set((update.products ?? []).flatMap((product) => product.prices));
    const missing = [catalog.solo.monthlyPriceId, catalog.team.monthlyPriceId].filter((id) => !allowedPrices.has(id));
    if (missing.length) {
        throw new Error(`Customer Portal configuration ${config.id} does not offer the e2e price(s) ${missing.join(', ')}. Add them to the plan switching products in the sandbox Dashboard.`);
    }
}

export function writeCatalog(catalog: E2ECatalog): void {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(catalog, null, 2));
}

/**
 * Reads the catalog written by the Stripe global setup. Call it inside a
 * test or hook, not at module top level: Playwright loads spec files before
 * global setup runs.
 */
export function loadCatalog(): E2ECatalog {
    if (!fs.existsSync(CATALOG_FILE)) {
        throw new Error(`${CATALOG_FILE} not found. Run the suite with playwright.stripe.config.ts so its global setup seeds the catalog.`);
    }
    return JSON.parse(fs.readFileSync(CATALOG_FILE, 'utf8')) as E2ECatalog;
}

// Run tracking. Specs run in worker processes and teardown in the runner, so
// tracked ids go to a shared append-only file rather than module state.

type Tracked = { kind: 'customer' | 'test_clock'; id: string };

function track(entry: Tracked): void {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
    fs.appendFileSync(TRACKED_FILE, `${JSON.stringify(entry)}\n`);
}

export function trackCustomer(id: string): void {
    track({ kind: 'customer', id });
}

export function trackTestClock(id: string): void {
    track({ kind: 'test_clock', id });
}

export interface CleanupResult {
    deletedCustomers: string[];
    deletedTestClocks: string[];
    errors: string[];
}

async function deleteIgnoringMissing(fn: () => Promise<unknown>): Promise<boolean> {
    try {
        await fn();
        return true;
    } catch (err) {
        if (isStripeError(err, 'resource_missing')) {
            return false;
        }
        throw err;
    }
}

/**
 * Deletes everything tracked during the run. Test clocks go first: deleting a
 * clock deletes its customers. Deleting a customer cancels its subscriptions.
 */
export async function cleanupTracked(): Promise<CleanupResult> {
    const result: CleanupResult = { deletedCustomers: [], deletedTestClocks: [], errors: [] };
    if (!fs.existsSync(TRACKED_FILE)) {
        return result;
    }

    const entries = fs.readFileSync(TRACKED_FILE, 'utf8')
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Tracked);
    const clocks = [...new Set(entries.filter((e) => e.kind === 'test_clock').map((e) => e.id))];
    const customers = [...new Set(entries.filter((e) => e.kind === 'customer').map((e) => e.id))];

    for (const id of clocks) {
        try {
            if (await deleteIgnoringMissing(() => stripe().testHelpers.testClocks.del(id))) {
                result.deletedTestClocks.push(id);
            }
        } catch (err) {
            result.errors.push(`test clock ${id}: ${(err as Error).message}`);
        }
    }
    for (const id of customers) {
        try {
            if (await deleteIgnoringMissing(() => stripe().customers.del(id))) {
                result.deletedCustomers.push(id);
            }
        } catch (err) {
            result.errors.push(`customer ${id}: ${(err as Error).message}`);
        }
    }

    fs.rmSync(TRACKED_FILE, { force: true });
    return result;
}

export interface JanitorOptions {
    olderThanHours?: number;
    dryRun?: boolean;
}

/**
 * Removes leftovers of crashed runs: customers with an e2e email (or e2e
 * metadata) and e2e-named test clocks, created more than `olderThanHours` ago.
 *
 * Uses list endpoints with a `created` filter and matches emails client side.
 * The customer list `email` filter is exact match only, and Search can lag
 * behind by minutes, which would make cleanup nondeterministic.
 */
export async function janitor({ olderThanHours = 24, dryRun = false }: JanitorOptions = {}): Promise<CleanupResult> {
    const cutoff = Math.floor(Date.now() / 1000) - Math.round(olderThanHours * 3600);
    const result: CleanupResult = { deletedCustomers: [], deletedTestClocks: [], errors: [] };

    const clockIds: string[] = [];
    for await (const clock of stripe().testHelpers.testClocks.list({ limit: 100 })) {
        if (clock.created < cutoff && clock.name?.startsWith('e2e ')) {
            clockIds.push(clock.id);
        }
    }

    const customerIds: string[] = [];
    for await (const customer of stripe().customers.list({ created: { lt: cutoff }, limit: 100 })) {
        const isE2E = E2E_EMAIL_PATTERN.test(customer.email ?? '') || customer.metadata?.e2e === 'true';
        // Customers on a clock are removed with the clock.
        const onDoomedClock = typeof customer.test_clock === 'string' && clockIds.includes(customer.test_clock);
        if (isE2E && !onDoomedClock) {
            customerIds.push(customer.id);
        }
    }

    for (const id of clockIds) {
        try {
            if (dryRun || await deleteIgnoringMissing(() => stripe().testHelpers.testClocks.del(id))) {
                result.deletedTestClocks.push(id);
            }
        } catch (err) {
            result.errors.push(`test clock ${id}: ${(err as Error).message}`);
        }
    }
    for (const id of customerIds) {
        try {
            if (dryRun || await deleteIgnoringMissing(() => stripe().customers.del(id))) {
                result.deletedCustomers.push(id);
            }
        } catch (err) {
            result.errors.push(`customer ${id}: ${(err as Error).message}`);
        }
    }

    return result;
}

// Test clocks and customers

export interface ClockCustomer {
    customer: Stripe.Customer;
    clock: Stripe.TestHelpers.TestClock;
}

export interface ClockCustomerOptions {
    email?: string;
    name?: string;
    // Unix seconds. Defaults to now.
    frozenTime?: number;
}

/** Creates a test clock and a customer bound to it; both are tracked. */
export async function createClockCustomer(options: ClockCustomerOptions = {}): Promise<ClockCustomer> {
    const email = options.email ?? e2eEmail('clock');
    const clock = await stripe().testHelpers.testClocks.create({
        frozen_time: options.frozenTime ?? Math.floor(Date.now() / 1000),
        name: `e2e ${email}`,
    });
    trackTestClock(clock.id);

    const customer = await stripe().customers.create({
        email,
        name: options.name ?? 'E2E Clock Customer',
        test_clock: clock.id,
        metadata: { e2e: 'true' },
    });
    return { customer, clock };
}

/** Creates a plain customer (no clock) and tracks it. */
export async function createCustomer(email = e2eEmail('customer')): Promise<Stripe.Customer> {
    const customer = await stripe().customers.create({ email, name: 'E2E Customer', metadata: { e2e: 'true' } });
    trackCustomer(customer.id);
    return customer;
}

export async function waitForClockReady(clockId: string, timeoutMs = 120_000): Promise<Stripe.TestHelpers.TestClock> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const clock = await stripe().testHelpers.testClocks.retrieve(clockId);
        if (clock.status === 'ready') {
            return clock;
        }
        if (clock.status === 'internal_failure') {
            throw new Error(`test clock ${clockId} failed to advance`);
        }
        if (Date.now() > deadline) {
            throw new Error(`test clock ${clockId} still ${clock.status} after ${timeoutMs}ms`);
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
    }
}

/**
 * Advances a clock to `to` (unix seconds) or by `{ days }` / `{ seconds }`
 * from its current frozen time, then waits until it is ready.
 */
export async function advanceClock(
    clockId: string,
    to: number | { days?: number; seconds?: number },
    timeoutMs?: number,
): Promise<Stripe.TestHelpers.TestClock> {
    let target: number;
    if (typeof to === 'number') {
        target = to;
    } else {
        const clock = await stripe().testHelpers.testClocks.retrieve(clockId);
        target = clock.frozen_time + (to.days ?? 0) * 86400 + (to.seconds ?? 0);
    }
    await stripe().testHelpers.testClocks.advance(clockId, { frozen_time: target });
    return waitForClockReady(clockId, timeoutMs);
}

// Payments

/**
 * Simulates a customer paying for a recurring plan without hosted Checkout:
 * attaches the `pm_card_visa` test card, makes it the default, and creates
 * the subscription. Stripe then sends the usual subscription webhooks.
 */
export async function subscribeWithTestCard(customerId: string, priceId: string): Promise<Stripe.Subscription> {
    const paymentMethod = await stripe().paymentMethods.attach('pm_card_visa', { customer: customerId });
    await stripe().customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethod.id },
    });
    return stripe().subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        default_payment_method: paymentMethod.id,
        metadata: { e2e: 'true' },
    });
}

/**
 * Makes a Stripe test PaymentMethod the card a subscription renews with,
 * without charging anything. With `pm_card_chargeCustomerFail` the card
 * attaches fine and every later charge is declined.
 *
 * The subscription's own default payment method wins over the customer's, so
 * both are set.
 */
export async function setRenewalCard(subscriptionId: string, testPaymentMethod: string): Promise<Stripe.PaymentMethod> {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId);
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
    const paymentMethod = await stripe().paymentMethods.attach(testPaymentMethod, { customer: customerId });
    await stripe().customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethod.id },
    });
    await stripe().subscriptions.update(subscriptionId, { default_payment_method: paymentMethod.id });
    return paymentMethod;
}

/** Moves a subscription's single item to another price, prorating like the portal does. */
export async function changeSubscriptionPrice(subscriptionId: string, priceId: string): Promise<Stripe.Subscription> {
    const subscription = await stripe().subscriptions.retrieve(subscriptionId);
    return stripe().subscriptions.update(subscriptionId, {
        items: [{ id: subscription.items.data[0].id, price: priceId }],
        proration_behavior: 'create_prorations',
    });
}

export async function cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    return stripe().subscriptions.cancel(subscriptionId);
}
