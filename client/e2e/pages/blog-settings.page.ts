import { Page, Locator } from '@playwright/test';

export class BlogSettingsPage {
    readonly outputItems: Locator;

    constructor(private page: Page) {
        this.outputItems = page.locator('li[ng-repeat="output in settings.outputs"]');
    }

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

    async openOutputsTab(): Promise<void> {
        await this.page.locator('[data="blog-settings-outputs"] a').click();
        await this.page.locator('.split-content.outputs').waitFor();
    }

    async createOutput(name: string): Promise<void> {
        await this.page.locator('button[ng-click="settings.openOutputDialog();"]').click();
        await this.page.locator('[ng-model="self.output.name"]').waitFor();
        await this.page.locator('[ng-model="self.output.name"]').fill(name);
        await this.page.locator('button[ng-click="self.saveOutput()"]:not([disabled])').waitFor();
        await this.page.locator('button[ng-click="self.saveOutput()"]').click();
        await this.page.locator('[ng-model="self.output.name"]').waitFor({ state: 'hidden' });
    }

    async deleteFirstOutput(): Promise<void> {
        await this.outputItems.first().hover();
        await this.outputItems.first().locator('button[ng-click="settings.removeOutput(output, $index);"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }
}
