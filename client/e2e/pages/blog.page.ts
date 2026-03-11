import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class BlogPage extends BasePage {
    constructor(page: Page) {
        super(page);
    }

    async open(index: number): Promise<void> {
        await this.page.goto('/#/liveblog');
        await this.page.locator('ul.card-list li[ng-repeat]').first().waitFor();
        await this.page.locator('ul.card-list li[ng-repeat]').nth(index).click();
        await this.page.locator('.column--timeline').waitFor();
    }

    async openEditorPanel(): Promise<void> {
        await this.page.locator('button.navbtn[ng-click="openPanel(\'editor\')"]').dispatchEvent('click');
        await this.page.locator('.st-text-block').waitFor();
    }

    async openContributionsPanel(): Promise<void> {
        await this.page.locator('button.navbtn[ng-click="openPanel(\'contributions\')"]').dispatchEvent('click');
        await this.page.locator('.panel--contribution').waitFor();
    }

    contributionPosts(): Locator {
        return this.page.locator('.panel--contribution lb-post');
    }

    publishButton(): Locator {
        return this.page.locator('[ng-click="publish()"]');
    }

    async typeAndPublish(text: string): Promise<void> {
        const textBlock = this.page.locator('.st-text-block');
        await textBlock.waitFor();
        await textBlock.click();
        await this.page.keyboard.type(text);
        await this.page.locator('[ng-click="publish()"]:not([disabled])').waitFor();
        await this.page.locator('[ng-click="publish()"]').click();
    }
}
