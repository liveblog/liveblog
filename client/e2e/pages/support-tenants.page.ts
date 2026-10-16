import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class SupportTenantsPage extends BasePage {
    readonly navLink: Locator;
    readonly tenantsList: Locator;
    readonly tenantRows: Locator;
    readonly detailPane: Locator;
    readonly userRows: Locator;
    readonly impersonateOwnerButton: Locator;
    readonly banner: Locator;
    readonly stopButton: Locator;
    readonly filterInput: Locator;

    constructor(page: Page) {
        super(page);
        this.navLink = page.locator('a[href="#/settings/tenants"]');
        this.tenantsList = page.getByTestId('support-tenants-list');
        this.tenantRows = page.getByTestId('tenant-row');
        this.detailPane = page.getByTestId('tenant-detail');
        // Users and the owner shortcut live in the detail pane of the selected
        // tenant. Scoping them to the pane keeps rows from a previously
        // selected tenant, or an unrelated list, from matching.
        this.userRows = this.detailPane.getByTestId('tenant-user-row');
        this.impersonateOwnerButton = this.detailPane.getByTestId('impersonate-owner');
        this.banner = page.getByTestId('impersonation-banner');
        this.stopButton = page.getByTestId('impersonation-stop');
        this.filterInput = page.getByTestId('tenants-filter');
    }

    async search(term: string): Promise<void> {
        await this.filterInput.fill(term);
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

    impersonateUserButton(userText: string): Locator {
        return this.userRow(userText).getByTestId('impersonate-user');
    }

    // Selecting a tenant in the master list loads the right-hand detail pane
    // (tenant info, counts, billing, users). Callers assert against the pane
    // once this resolves.
    async selectTenant(name: string): Promise<void> {
        await this.tenantRow(name).click();
        await this.detailPane.waitFor();
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
