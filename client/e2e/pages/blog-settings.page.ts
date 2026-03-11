import { Page, Locator } from '@playwright/test';

export class BlogSettingsPage {
    constructor(private page: Page) {}

    titleInput(): Locator {
        return this.page.locator('[ng-model="settings.newBlog.title"]');
    }

    ownerDisplayName(): Locator {
        return this.page.locator('[data="original-creator-display-name"]').first();
    }

    ownerUsername(): Locator {
        return this.page.locator('[data="original-creator-username"]').first();
    }

    async updateTitle(title: string): Promise<void> {
        await this.titleInput().fill(title);
    }

    async saveAndClose(): Promise<void> {
        await this.page.locator('[ng-click="settings.saveAndClose()"]').click();
        await this.page.locator('a.settings-link').waitFor();
    }

    async openTeamTab(): Promise<void> {
        await this.page.locator('[data="blog-settings-team"] a').click();
    }

    async toggleStatus(): Promise<void> {
        await this.page.getByTestId('blog-status-switch').click();
    }

    async removeBlog(): Promise<void> {
        await this.page.locator('button[ng-click="settings.askRemoveBlog()"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }
}
