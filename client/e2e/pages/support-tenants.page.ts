import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SupportTenantsPage extends BasePage {
    readonly navLink: Locator;
    readonly tenantsList: Locator;
    readonly tenantRows: Locator;
    readonly usersList: Locator;
    readonly userRows: Locator;
    readonly banner: Locator;
    readonly stopButton: Locator;

    constructor(page: Page) {
        super(page);
        this.navLink = page.locator('a[href="#/settings/tenants"]');
        this.tenantsList = page.getByTestId('support-tenants-list');
        this.tenantRows = page.getByTestId('tenant-row');
        this.usersList = page.getByTestId('tenant-users-list');
        this.userRows = page.getByTestId('tenant-user-row');
        this.banner = page.getByTestId('impersonation-banner');
        this.stopButton = page.getByTestId('impersonation-stop');
    }

    // Deep-linking a settings route right after boot races superdesk's route
    // resolution and bounces to the default view, so navigation goes through
    // the main menu like the rest of the suite. The settings entry lands on
    // the first visible pane (general), then the sidebar link opens Tenants.
    async openSettings(): Promise<void> {
        await this.openSection('#/settings/');
        await this.page.locator('a[href="#/settings/general"]').waitFor();
    }

    async open(): Promise<void> {
        await this.openSettings();
        await this.navLink.click();
        await this.tenantsList.waitFor();
    }

    tenantRow(name: string): Locator {
        return this.tenantRows.filter({ hasText: name });
    }

    userRow(text: string): Locator {
        return this.userRows.filter({ hasText: text });
    }

    impersonateOwnerButton(tenantName: string): Locator {
        return this.tenantRow(tenantName).getByTestId('impersonate-owner');
    }

    impersonateUserButton(userText: string): Locator {
        return this.userRow(userText).getByTestId('impersonate-user');
    }

    async expandTenant(name: string): Promise<void> {
        await this.tenantRow(name).getByTestId('tenant-expand').click();
        await this.usersList.waitFor();
    }

    // Impersonation swaps the session and hard-reloads, so callers must wait
    // on post-reload state (banner visible, app ready) after this resolves.
    async impersonateUser(userText: string): Promise<void> {
        await this.impersonateUserButton(userText).click();
    }

    async stopImpersonating(): Promise<void> {
        await this.stopButton.click();
    }
}
