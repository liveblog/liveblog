import { Db, MongoClient, ObjectId } from 'mongodb';

// The 3.x driver is pinned on purpose: the stack runs MongoDB 3.4 (wire
// version 5) and driver 4+ refuses to connect to anything older than 3.6.
export const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27019/lb_stripe_e2e';

// The tenants resource has no search backend and `get_tenant` caches the
// document in flask.g for a single request only, so direct writes here are
// what the next API request sees.

export interface TenantBilling {
    _id: string;
    name: string;
    subscription_level?: string;
    plan_expires_at?: Date | null;
    plan_price_id?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    stripe_subscription_status?: string | null;
}

let clientPromise: Promise<MongoClient> | undefined;

async function db(): Promise<Db> {
    if (!clientPromise) {
        clientPromise = MongoClient.connect(MONGO_URI, {
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        });
    }
    return (await clientPromise).db();
}

export async function closeTenantsDb(): Promise<void> {
    if (clientPromise) {
        const client = await clientPromise;
        clientPromise = undefined;
        await client.close();
    }
}

const BILLING_FIELDS = {
    name: 1,
    subscription_level: 1,
    plan_expires_at: 1,
    plan_price_id: 1,
    stripe_customer_id: 1,
    stripe_subscription_id: 1,
    stripe_subscription_status: 1,
};

function toObjectId(id: string | ObjectId): ObjectId {
    return typeof id === 'string' ? new ObjectId(id) : id;
}

export async function getTenant(tenantId: string): Promise<TenantBilling> {
    const doc = await (await db()).collection('tenants').findOne(
        { _id: toObjectId(tenantId) },
        { projection: BILLING_FIELDS },
    );
    if (!doc) {
        throw new Error(`tenant ${tenantId} not found in ${MONGO_URI}`);
    }
    return { ...doc, _id: String(doc._id) } as TenantBilling;
}

/** Finds the tenant of the user with this email or username. */
export async function findTenantByUser(emailOrUsername: string): Promise<TenantBilling> {
    const user = await (await db()).collection('users').findOne(
        { $or: [{ email: emailOrUsername }, { username: emailOrUsername }] },
        { projection: { tenant_id: 1 } },
    );
    if (!user?.tenant_id) {
        throw new Error(`no user with a tenant found for ${emailOrUsername}`);
    }
    return getTenant(String(user.tenant_id));
}

async function updateTenant(tenantId: string, set: Partial<Omit<TenantBilling, '_id'>>): Promise<void> {
    const result = await (await db()).collection('tenants').updateOne(
        { _id: toObjectId(tenantId) },
        { $set: set },
    );
    if (result.matchedCount !== 1) {
        throw new Error(`tenant ${tenantId} not found in ${MONGO_URI}`);
    }
}

/** Moves `plan_expires_at` into the past so the Go plan reads as expired. */
export async function expireGoPlan(tenantId: string, expiredAt = new Date(Date.now() - 60_000)): Promise<void> {
    await updateTenant(tenantId, { plan_expires_at: expiredAt });
}

export interface GoPlanState {
    priceId: string;
    expiresAt: Date;
}

/**
 * Writes the fields a Go purchase webhook would write. Lets specs start from
 * "has (or had) a Go plan bought with price X" without hosted Checkout.
 */
export async function setGoPlan(tenantId: string, { priceId, expiresAt }: GoPlanState): Promise<void> {
    await updateTenant(tenantId, {
        subscription_level: 'liveblog-go',
        plan_price_id: priceId,
        plan_expires_at: expiresAt,
    });
}

/**
 * Points the tenant at another Stripe customer, e.g. one bound to a test
 * clock. Registration creates the tenant's customer without a clock, and a
 * clock can only be set when the customer is created.
 */
export async function setStripeCustomer(tenantId: string, customerId: string): Promise<void> {
    await updateTenant(tenantId, { stripe_customer_id: customerId });
}
