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
}
