// Tenant impersonation (LBSD-2960): full impersonation cycle.
//
// Impersonation swaps the session and hard-reloads the app, so each step
// waits for the banner plus app readiness before asserting. User rows are
// targeted by email (unique in the seeded data set; usernames and user types
// collide as substrings across rows).
import { test, expect } from '../../fixtures';
import { LoginPage } from '../../pages/login.page';
import { SupportTenantsPage } from '../../pages/support-tenants.page';
import { BlogsListPage } from '../../pages/blogs-list.page';
import { DEFAULT_TENANT_NAME, INACTIVE_USER, SUPPORT_USER, createUser } from '../../api/seed';

test('impersonating a tenant admin swaps identity, shows tenant data and stops cleanly', async ({ supportPage }) => {
    const tenants = new SupportTenantsPage(supportPage);
    const login = new LoginPage(supportPage);

    await tenants.open();
    await tenants.expandTenant(DEFAULT_TENANT_NAME);
    await tenants.impersonateUser('abc@other.com');

    await tenants.banner.waitFor();
    await login.waitForReady();
    await expect(tenants.banner).toContainText('Impersonating Edwin the admin');
    await expect(tenants.banner).toContainText(DEFAULT_TENANT_NAME);

    await supportPage.locator('button.current-user').click();
    await expect(login.displayName).toHaveText('admin');

    const blogs = new BlogsListPage(supportPage);
    await blogs.open();
    await expect(blogs.blogItems.first()).toBeVisible();

    await tenants.stopImpersonating();
    // The banner disappearing is the first post-reload signal; only then is
    // waiting for app readiness guaranteed to run against the new document.
    await expect(tenants.banner).not.toBeVisible();
    await login.waitForReady();

    await supportPage.locator('button.current-user').click();
    await expect(login.displayName).toHaveText(SUPPORT_USER.username);
});

test('impersonating a non-admin user keeps the banner and stop reachable', async ({ supportPage }) => {
    const tenants = new SupportTenantsPage(supportPage);
    const login = new LoginPage(supportPage);

    await tenants.open();
    await tenants.expandTenant(DEFAULT_TENANT_NAME);
    await tenants.impersonateUser('contributor@other.com');

    await tenants.banner.waitFor();
    await login.waitForReady();
    await expect(tenants.banner).toContainText('Impersonating Gregor the contributor');
    await expect(tenants.stopButton).toBeVisible();

    await supportPage.locator('button.current-user').click();
    await expect(login.displayName).toHaveText('contributor');
});

test('impersonate owner shortcut targets the tenant owner', async ({ supportPage }) => {
    const tenants = new SupportTenantsPage(supportPage);
    const login = new LoginPage(supportPage);

    await tenants.open();
    await tenants.impersonateOwnerButton(DEFAULT_TENANT_NAME).click();

    await tenants.banner.waitFor();
    await login.waitForReady();
    // The default tenant owner is test_user, display name "first name last name".
    await expect(tenants.banner).toContainText('Impersonating first name last name');
    await expect(tenants.banner).toContainText(DEFAULT_TENANT_NAME);

    await supportPage.locator('button.current-user').click();
    await expect(login.displayName).toHaveText('test_user');
});

test('impersonate button is disabled for an inactive user', async ({ supportPage, api }) => {
    await createUser(api, INACTIVE_USER);

    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();
    await tenants.expandTenant(DEFAULT_TENANT_NAME);

    await expect(tenants.userRow(INACTIVE_USER.email)).toBeVisible();
    await expect(tenants.impersonateUserButton(INACTIVE_USER.email)).toBeDisabled();
});

// The Ownerless tenant comes from the prepopulate test profile (a tenants
// entry with no owner_user_id). Tenants are an internal resource with no
// REST exposure, so the profile is the only seeding path.
test('impersonate owner is disabled for a tenant without an owner', async ({ supportPage }) => {
    const tenants = new SupportTenantsPage(supportPage);
    await tenants.open();

    await expect(tenants.tenantRow('Ownerless')).toBeVisible();
    const ownerButton = tenants.impersonateOwnerButton('Ownerless');
    await expect(ownerButton).toBeDisabled();
    await expect(ownerButton).toHaveAttribute('title', 'This tenant has no owner assigned');
});
