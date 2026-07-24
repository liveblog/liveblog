// Tenant impersonation (LBSD-2960): support-only Tenants pane under Settings.
//
// Seeding: is_support is not settable over REST (production grants it via the
// users:create --support CLI command, and the REST layer strips the field).
// The support user is seeded by the prepopulate test profile
// (server/liveblog/prepopulate/test.json), which posts through the system
// users service and therefore persists the flag. A second tenant is created
// through the public POST /api/register endpoint, which sets the new user as
// tenant owner. No prerequisites beyond the standard e2e stack.
import { test, expect } from '../../fixtures';
import { SupportTenantsPage } from '../../pages/support-tenants.page';
import {
    DEFAULT_TENANT_NAME,
    TENANT2_OWNER,
    WOULD_BE_SUPPORT,
    WOULD_BE_SUPPORT_REGISTRANT,
    createUser,
    registerTenantOwner,
} from '../../api/seed';

test('support user sees the tenants pane with all tenants', async ({ supportPage, api }) => {
    const tenant2 = await registerTenantOwner(api, TENANT2_OWNER);
    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();

    await expect(tenants.navLink).toBeVisible();
    await expect(tenants.tenantRow(DEFAULT_TENANT_NAME)).toBeVisible();
    await expect(tenants.tenantRow(tenant2.tenantName)).toBeVisible();
});

test('expanding a tenant lists its users', async ({ supportPage }) => {
    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();
    await tenants.expandTenant(DEFAULT_TENANT_NAME);

    await expect(tenants.userRow('abc@other.com')).toBeVisible();
    await expect(tenants.userRow('contributor@other.com')).toBeVisible();
});

test('non-support admin does not see the tenants pane', async ({ authenticatedPage }) => {
    const tenants = new SupportTenantsPage(authenticatedPage);
    await tenants.openSettings();

    await expect(authenticatedPage.locator('a[href="#/settings/general"]')).toBeVisible();
    await expect(tenants.navLink).toHaveCount(0);
});

test('support endpoints reject a non-support user', async ({ api }) => {
    const tenantsResponse = await api.get('/support/tenants', { as: 'admin' });
    expect(tenantsResponse.status).toBe(403);

    const usersResponse = await api.get('/support/tenants/000000000000000000000000/users', { as: 'admin' });
    expect(usersResponse.status).toBe(403);

    const impersonateResponse = await api.post(
        '/support/impersonate',
        { user_id: '000000000000000000000000' },
        { as: 'admin' },
    );
    expect(impersonateResponse.status).toBe(403);

    // Stop is deliberately not support-gated: it is called by the
    // impersonated (non-support) target. A regular session gets 400
    // (not an impersonation session) instead of 403.
    const stopResponse = await api.post('/support/impersonate/stop', {}, { as: 'admin' });
    expect(stopResponse.status).toBe(400);
});

test('support endpoints reject anonymous requests', async ({ api }) => {
    const response = await api.get('/support/tenants');
    expect([401, 403]).toContain(response.status);
});

// Canary for the closed seeding holes: granting is_support over REST must be
// impossible on every path. The legacy system users endpoint is internal
// (404), the tenant users endpoint strips the flag, and the public
// registration endpoint strips it too (previously an anonymous cross-tenant
// escalation). A pass here in reverse means a privilege escalation is back.
test('is_support cannot be granted over REST', async ({ api }) => {
    const usersResponse = await api.post(
        '/users',
        { needs_activation: false, ...WOULD_BE_SUPPORT },
        { as: 'admin' },
    );
    expect(usersResponse.status).toBe(404);

    await createUser(api, WOULD_BE_SUPPORT);
    const supportResponse = await api.get('/support/tenants', { as: WOULD_BE_SUPPORT });
    expect(supportResponse.status).toBe(403);

    // Anonymous registration with is_support: true in the payload.
    await registerTenantOwner(api, WOULD_BE_SUPPORT_REGISTRANT);
    const registrantResponse = await api.get('/support/tenants', { as: WOULD_BE_SUPPORT_REGISTRANT });
    expect(registrantResponse.status).toBe(403);
});

// Positive counterpart: the profile-seeded support user really has support
// access. Fails loudly if the prepopulate seeding breaks, which would
// otherwise surface as confusing failures across every UI test here.
test('support user can list tenants and tenant users over the API', async ({ api }) => {
    const tenantsResponse = await api.get<{ tenants: Array<{ _id: string; name: string }> }>(
        '/support/tenants',
        { as: 'support' },
    );
    expect(tenantsResponse.status).toBe(200);

    const defaultTenant = tenantsResponse.body.tenants.find((tenant) => tenant.name === DEFAULT_TENANT_NAME);
    expect(defaultTenant).toBeTruthy();

    const usersResponse = await api.get(`/support/tenants/${defaultTenant?._id}/users`, { as: 'support' });
    expect(usersResponse.status).toBe(200);
    expect(JSON.stringify(usersResponse.body)).not.toContain('"password"');
});
