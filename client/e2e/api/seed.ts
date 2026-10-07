import { ApiClient, PERSONAS } from './client';

export interface SeedUser {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
    user_type?: 'user' | 'administrator';
    is_support?: boolean;
    is_active?: boolean;
    needs_activation?: boolean;
}

export interface RegisteredTenant {
    userId: string;
    tenantId: string;
    tenantName: string;
}

// Prepopulate registers the default user (test_user) through RegistrationService,
// which names the tenant "<first_name>'s LiveBlog". test_user's first_name is
// "first name", so the default tenant is:
export const DEFAULT_TENANT_NAME = "first name's LiveBlog";

// Seeded by the prepopulate test profile (server/liveblog/prepopulate/test.json)
// with is_support: true. Prepopulate posts through the system users service,
// which is the only non-CLI path that persists the flag; REST strips it.
// Credentials come from PERSONAS, the single source of seeded passwords.
export const SUPPORT_USER: SeedUser = {
    ...PERSONAS.support,
    email: 'support@other.com',
    first_name: 'Sonia',
    last_name: 'the support',
    user_type: 'administrator',
};

// Posts is_support: true on purpose; the REST layer must strip it. Used by
// the canary test proving the flag cannot be granted over REST.
export const WOULD_BE_SUPPORT: SeedUser = {
    username: 'impostor',
    password: 'impostor',
    email: 'impostor@other.com',
    first_name: 'Ivan',
    last_name: 'the impostor',
    user_type: 'administrator',
    is_support: true,
};

// Registers through the public /api/register endpoint with is_support: true
// on purpose; RegistrationService must strip it. Unique credentials, no
// collision with prepopulate personas.
export const WOULD_BE_SUPPORT_REGISTRANT: SeedUser = {
    username: 'regimpostor',
    password: 'regimpostor',
    email: 'regimpostor@other.com',
    first_name: 'Rita',
    last_name: 'the registrant',
    is_support: true,
};

export const INACTIVE_USER: SeedUser = {
    username: 'dormant',
    password: 'dormant',
    email: 'dormant@other.com',
    first_name: 'Dora',
    last_name: 'the dormant',
    user_type: 'user',
    is_active: false,
};

export const TENANT2_OWNER: SeedUser = {
    username: 'tenant2owner',
    password: 'tenant2pass',
    email: 'owner@tenant2.com',
    first_name: 'Olive',
    last_name: 'the owner',
};

// Creates a user through the regular tenant users endpoint (the same path the
// UI uses), which handles password hashing and tenant routing. The created
// user inherits the creator's tenant_id (default tenant). is_support in the
// payload is stripped by the server; real support users come from the
// prepopulate profile.
export async function createUser(api: ApiClient, user: SeedUser): Promise<string> {
    const response = await api.post<{ _id: string }>(
        '/liveblog_users',
        { needs_activation: false, ...user },
        { as: 'admin' },
    );

    if (!response.ok) {
        throw new Error(`create user ${user.username} failed: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return response.body._id;
}

// The public registration endpoint creates a tenant owned by the new user
// (owner_user_id set, user_type forced to administrator). Extra user fields
// such as needs_activation flow through to the users service, so the owner
// can log in (and be impersonated) right away.
export async function registerTenantOwner(api: ApiClient, owner: SeedUser): Promise<RegisteredTenant> {
    const response = await api.post<{ user_id: string; tenant_id: string; tenant_name: string }>(
        '/register',
        { needs_activation: false, ...owner },
    );

    if (!response.ok) {
        throw new Error(`register ${owner.username} failed: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return {
        userId: response.body.user_id,
        tenantId: response.body.tenant_id,
        tenantName: response.body.tenant_name,
    };
}
