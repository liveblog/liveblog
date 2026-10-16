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

test('selecting a tenant shows its users in the detail pane', async ({ supportPage }) => {
    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();
    await tenants.selectTenant(DEFAULT_TENANT_NAME);

    await expect(tenants.detailPane).toBeVisible();
    await expect(tenants.userRow('abc@other.com')).toBeVisible();
    await expect(tenants.userRow('contributor@other.com')).toBeVisible();
});

test('the detail pane reflects the tenant blog and user counts and billing', async ({ supportPage, api }) => {
    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();
    await tenants.selectTenant(DEFAULT_TENANT_NAME);
    await expect(tenants.detailPane).toBeVisible();

    // Cross-check the rendered pane against the API contract rather than
    // guessing at count text: the number of user rows in the pane must equal
    // the users_count the detail endpoint reports for the same tenant.
    const list = await api.get<{ tenants: Array<{ _id: string; name: string }> }>(
        '/support/tenants',
        { as: 'support' },
    );
    const tenant = list.body.tenants.find((entry) => entry.name === DEFAULT_TENANT_NAME);
    expect(tenant).toBeTruthy();

    const detail = await api.get<{
        stats: { blogs_count: number; users_count: number };
        billing: { access_allowed: boolean };
    }>(`/support/tenants/${tenant?._id}`, { as: 'support' });
    expect(detail.status).toBe(200);
    expect(detail.body.stats.users_count).toBeGreaterThan(0);

    await expect(tenants.userRows).toHaveCount(detail.body.stats.users_count);
    // The pane renders the counts and a billing indicator; assert the numbers
    // it must contain are present (users and blogs counts from the endpoint).
    await expect(tenants.detailPane).toContainText(String(detail.body.stats.users_count));
    await expect(tenants.detailPane).toContainText(String(detail.body.stats.blogs_count));
});

test('filtering by a member email surfaces that member tenant', async ({ supportPage, api }) => {
    const tenant2 = await registerTenantOwner(api, TENANT2_OWNER);
    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();

    await expect(tenants.tenantRow(DEFAULT_TENANT_NAME)).toBeVisible();
    await expect(tenants.tenantRow(tenant2.tenantName)).toBeVisible();

    // abc@other.com is a non-owner member of the default tenant, so the
    // filter must match it (not only tenant name or owner email).
    await tenants.search('abc@other.com');

    await expect(tenants.tenantRow(DEFAULT_TENANT_NAME)).toBeVisible();
    await expect(tenants.tenantRow(tenant2.tenantName)).toHaveCount(0);

    await tenants.search('zzz-no-such-tenant');
    await expect(tenants.tenantRows).toHaveCount(0);
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

// The master-detail pane is backed by GET /support/tenants/<id>, which joins
// the tenant, its billing state and blog/user counts. Assert the contract the
// UI relies on: shape and support-gating, a 404 for an unknown id, and a 403
// for a non-support caller.
test('the tenant detail endpoint returns stats and billing and is support-gated', async ({ api }) => {
    const listResponse = await api.get<{ tenants: Array<{ _id: string; name: string }> }>(
        '/support/tenants',
        { as: 'support' },
    );
    expect(listResponse.status).toBe(200);
    const defaultTenant = listResponse.body.tenants.find((tenant) => tenant.name === DEFAULT_TENANT_NAME);
    expect(defaultTenant).toBeTruthy();

    const detailResponse = await api.get<{
        tenant: { _id: string; name: string };
        billing: { access_allowed: boolean };
        stats: { blogs_count: number; users_count: number };
    }>(`/support/tenants/${defaultTenant?._id}`, { as: 'support' });
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.tenant._id).toBe(defaultTenant?._id);
    expect(typeof detailResponse.body.stats.blogs_count).toBe('number');
    expect(typeof detailResponse.body.stats.users_count).toBe('number');
    expect(detailResponse.body.stats.users_count).toBeGreaterThan(0);
    expect(detailResponse.body.billing).toHaveProperty('access_allowed');

    const unknownResponse = await api.get('/support/tenants/000000000000000000000000', { as: 'support' });
    expect(unknownResponse.status).toBe(404);

    const forbiddenResponse = await api.get(`/support/tenants/${defaultTenant?._id}`, { as: 'admin' });
    expect(forbiddenResponse.status).toBe(403);
});
