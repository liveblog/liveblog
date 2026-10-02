import { ApiClient, ApiResponse, Credentials } from './client';
import { e2eEmail, trackCustomer } from './stripe';
import { findTenantByUser, getTenant, TenantBilling } from './tenants-db';

export interface E2EUser extends Credentials {
    email: string;
    userId: string;
    tenantId: string;
    // Created by the backend during registration; null if that best-effort call failed.
    customerId: string | null;
}

export interface BillingStatus {
    billing_required: boolean;
    access_allowed: boolean;
    redirect: 'pricing' | 'portal' | 'extend' | null;
    status: string | null;
    pricing_url?: string;
    plan_expires_at?: string | null;
    // Only present when redirect is "extend".
    checkout_price_id?: string;
}

export interface ApiErrorBody {
    _status: 'ERR';
    _error: string;
}

/**
 * Registers a fresh user (and tenant) through POST /api/register with an
 * e2e email, and tracks the Stripe customer the backend creates for it.
 */
export async function registerE2EUser(api: ApiClient, tag = 'user'): Promise<E2EUser> {
    const email = e2eEmail(tag);
    const username = email.slice('e2e+'.length, email.indexOf('@')).replace(/[^a-z0-9]/gi, '');
    const password = 'E2e-password-123!';

    const response = await api.post<{ user_id: string; tenant_id: string }>('/register', {
        username: `e2e${username}`,
        email,
        password,
        first_name: 'E2E',
        last_name: tag,
    });
    if (response.status !== 201) {
        throw new Error(`register ${email} failed: ${response.status} ${JSON.stringify(response.body)}`);
    }

    const tenant = await getTenant(response.body.tenant_id);
    if (tenant.stripe_customer_id) {
        trackCustomer(tenant.stripe_customer_id);
    }

    return {
        username: `e2e${username}`,
        password,
        email,
        userId: response.body.user_id,
        tenantId: response.body.tenant_id,
        customerId: tenant.stripe_customer_id ?? null,
    };
}

/**
 * Tracks the Stripe customer the backend created for a user who registered
 * through the UI rather than `registerE2EUser`.
 */
export async function trackRegisteredCustomer(emailOrUsername: string): Promise<TenantBilling> {
    const tenant = await findTenantByUser(emailOrUsername);
    if (tenant.stripe_customer_id) {
        trackCustomer(tenant.stripe_customer_id);
    }
    return tenant;
}

export async function getBillingStatus(api: ApiClient, user: Credentials): Promise<BillingStatus> {
    const response = await api.get<BillingStatus>('/billing/status', { as: user });
    if (!response.ok) {
        throw new Error(`billing status for ${user.username} failed: ${response.status} ${JSON.stringify(response.body)}`);
    }
    return response.body;
}

/** POST /api/billing/checkout. Returns the raw response so specs can assert rejections. */
export async function createCheckoutSession(
    api: ApiClient,
    user: Credentials,
    priceId: string,
    returnUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:9055',
): Promise<ApiResponse<{ url: string } | ApiErrorBody>> {
    return api.post('/billing/checkout', { price_id: priceId, return_url: returnUrl }, { as: user });
}
