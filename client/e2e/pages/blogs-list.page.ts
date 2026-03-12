import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class BlogsListPage extends BasePage {
    readonly blogItems: Locator;
    readonly createButton: Locator;

    constructor(page: Page) {
        super(page);
        this.blogItems = page.locator('ul.card-list li[ng-repeat]');
        this.createButton = page.locator('button.sd-create-btn[ng-click="openNewBlog();"]');
    }

    async open(): Promise<void> {
        await this.page.goto('/#/liveblog');
        await this.blogItems.first().waitFor();
    }

    blogTitles(): Locator {
        return this.page.locator('ul.card-list li h3');
    }

    listViewRows(): Locator {
        return this.page.locator('table.row-list tbody tr[ng-repeat]');
    }

    async switchToListView(): Promise<void> {
        await this.page.locator('button[ng-click="setBlogsView(\'list\');"]').click();
    }

    async selectState(name: string): Promise<void> {
        await this.page.locator('ul.nav-tabs li[ng-repeat="state in states"] button')
            .filter({ hasText: new RegExp(name, 'i') })
            .click();
    }

    async search(query: string): Promise<void> {
        await this.page.locator('label.trigger-icon').click();
        await this.page.locator('input#search-input').fill(query);
    }

    async openBlogSettings(index = 0): Promise<void> {
        await this.blogItems.nth(index).click();
        await this.page.locator('a.settings-link').waitFor();
        await this.page.locator('a.settings-link').click();
        await this.page.locator('[ng-model="settings.newBlog.title"]').waitFor();
    }

    async createBlog(title: string): Promise<void> {
        await this.createButton.click();
        await this.page.locator('[ng-model="newBlog.title"]').fill(title);
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.locator('button[ng-click="createBlog()"]').click();
        await this.page.locator('a.navbtn.homebtn').click();
        await this.blogItems.first().waitFor();
    }

    async createBlogWithImage(title: string, imagePath: string): Promise<void> {
        await this.createButton.click();
        await this.page.locator('[ng-model="newBlog.title"]').fill(title);
        const fileInput = this.page.locator('.modal--tabs input[type="file"]');
        await fileInput.waitFor({ state: 'attached' });
        await fileInput.setInputFiles(imagePath);
        await this.page.locator('.modal--tabs img.preview-target-1').waitFor();
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.locator('button[ng-click="createBlog()"]').click();
        await this.page.locator('a.navbtn.homebtn').click();
        await this.blogItems.first().waitFor();
    }

    async createBlogWithMember(title: string, searchQuery: string): Promise<void> {
        await this.createButton.click();
        await this.page.locator('[ng-model="newBlog.title"]').fill(title);
        await this.page.getByRole('button', { name: 'Next' }).click();
        await this.page.locator('div[lb-user-select-list] input.searchbar').fill(searchQuery);
        const firstResult = this.page.locator('div[lb-user-select-list] ul.users-list-embed li').first();
        await firstResult.waitFor();
        await firstResult.click();
        await this.page.locator('button[ng-click="createBlog()"]').click();
        await this.page.locator('a.navbtn.homebtn').click();
        await this.blogItems.first().waitFor();
    }

    async requestBlogAccess(index: number): Promise<void> {
        await this.blogItems.nth(index).click();
        await this.page.locator('button[ng-click="requestAccess(accessRequestedTo)"]').waitFor();
        const responsePromise = this.page.waitForResponse(
            r => r.url().includes('/api/') && r.request().method() === 'POST'
        );
        await this.page.locator('button[ng-click="requestAccess(accessRequestedTo)"]').click();
        await responsePromise;
    }
}
