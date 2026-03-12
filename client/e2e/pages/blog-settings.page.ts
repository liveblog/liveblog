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

    async updateDescription(text: string): Promise<void> {
        await this.page.locator('textarea[name="inputDescription"]').fill(text);
    }

    async getDescription(): Promise<string> {
        return this.page.locator('textarea[name="inputDescription"]').inputValue();
    }

    async saveAndClose(): Promise<void> {
        await this.page.locator('[ng-click="settings.saveAndClose()"]').click();
        await this.page.locator('a.settings-link').waitFor();
    }

    async reopenSettings(): Promise<void> {
        await this.page.locator('a.settings-link').click();
        await this.page.locator('[ng-model="settings.newBlog.title"]').waitFor();
    }

    blogImage(): Locator {
        return this.page.locator('figure.blog-media');
    }

    async uploadBlogImage(filePath: string): Promise<void> {
        await this.page.getByTestId('upload-blog-image').click();
        await this.page.locator('#images-input').waitFor({ state: 'attached' });
        await this.page.locator('#images-input').setInputFiles(filePath);
        await this.page.locator('button[ng-click="save()"]:not([disabled])').waitFor();
        await this.page.locator('button[ng-click="save()"]').click();
        await this.page.locator('#images-input').waitFor({ state: 'detached' });
    }

    async removeBlogImage(): Promise<void> {
        await this.page.getByTestId('remove-blog-image').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }

    teamMembers(): Locator {
        return this.page.getByTestId('team-member');
    }

    async openTeamTab(): Promise<void> {
        await this.page.locator('[data="blog-settings-team"] a').click();
    }

    async editTeam(): Promise<void> {
        await this.page.locator('a[ng-click="settings.editTeam()"]').click();
        await this.page.locator('div.team-edit input.searchbar').waitFor();
    }

    async searchAndAddMember(query: string): Promise<void> {
        await this.page.locator('div.team-edit input.searchbar').fill(query);
        const firstResult = this.page.locator('div.team-edit ul.users-list-embed li').first();
        await firstResult.waitFor();
        await firstResult.click();
    }

    async doneTeamEdit(): Promise<void> {
        await this.page.locator('button[ng-click="settings.doneTeamEdit()"]').click();
        await this.page.locator('div.team-edit input.searchbar').waitFor({ state: 'hidden' });
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

    async acceptPendingMember(): Promise<void> {
        await this.page.locator('.pending-blog-member').hover();
        await this.page.locator('[data-button="ACCEPT-NEW-MEMBER"]').click();
        await this.page.locator('.pending-blog-member').waitFor({ state: 'detached' });
    }

    async deleteFirstOutput(): Promise<void> {
        await this.outputItems.first().hover();
        await this.outputItems.first().locator('button[ng-click="settings.removeOutput(output, $index);"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }
}
