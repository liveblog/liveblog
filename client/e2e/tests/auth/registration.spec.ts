// Public sign-up page (LBSD-2980): an account can only be created after
// agreeing to the Terms of Use and the Privacy Policy, in the UI and over the
// API. The stored acceptance record is asserted in billing/go.spec.ts, where
// the suite has database access.
import { test, expect } from '../../fixtures';
import { LoginPage } from '../../pages/login.page';
import { RegisterPage, RegistrationForm } from '../../pages/register.page';

const TERMS_OF_USE_URL = 'https://liveblog.pro/en/termsofuse/';
const PRIVACY_POLICY_URL = 'https://www.sourcefabric.org/about/policies#sourcefabricprivacyanddatapolicy';

const FORM: RegistrationForm = {
    firstName: 'Terry',
    lastName: 'the registrant',
    email: 'terry@other.com',
    username: 'terryregistrant',
    password: 'terry-password-123',
};

const API_PAYLOAD = {
    username: FORM.username,
    email: FORM.email,
    password: FORM.password,
    first_name: FORM.firstName,
    last_name: FORM.lastName,
};

test('the terms checkbox starts unticked and gates the Create account button', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();

    await expect(register.termsCheckbox).not.toBeChecked();
    await register.fill(FORM);
    await expect(register.submitButton).toBeDisabled();

    await register.termsCheckbox.check();
    await expect(register.submitButton).toBeEnabled();

    await register.termsCheckbox.uncheck();
    await expect(register.submitButton).toBeDisabled();
});

test('the terms and privacy links open their pages in a new tab', async ({ page, context }) => {
    // The spec is about where the links lead, not about the external sites being up.
    await context.route(/^https:\/\/(liveblog\.pro|www\.sourcefabric\.org)\//, (route) => route.fulfill({
        contentType: 'text/html',
        body: '<html><body>stub</body></html>',
    }));

    const register = new RegisterPage(page);
    await register.open();

    for (const [link, url] of [
        [register.termsOfUseLink, TERMS_OF_USE_URL],
        [register.privacyPolicyLink, PRIVACY_POLICY_URL],
    ] as const) {
        const [popup] = await Promise.all([page.waitForEvent('popup'), link.click()]);
        await popup.waitForURL(url);
        await popup.close();
    }

    // Following a link must not tick the box it sits next to.
    await expect(page).toHaveURL(/register\.html/);
    await expect(register.termsCheckbox).not.toBeChecked();
});

test('the API rejects a registration without terms acceptance', async ({ api }) => {
    for (const payload of [
        API_PAYLOAD,
        { ...API_PAYLOAD, terms_accepted: false },
        { ...API_PAYLOAD, terms_accepted: 'true' },
    ]) {
        const response = await api.post<{ _error: string }>('/register', payload);
        expect(response.status).toBe(400);
        expect(response.body._error).toContain('Terms of Use');
    }

    // None of the attempts created the account.
    const login = await api.post('/auth_db', { username: FORM.username, password: FORM.password });
    expect(login.ok).toBe(false);
});

test('ticking the box lets the account be created', async ({ page }) => {
    const register = new RegisterPage(page);
    await register.open();
    await register.register(FORM);

    await new LoginPage(page).waitForSession();
});
