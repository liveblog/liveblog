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

    async openDraftsPanel(): Promise<void> {
        await this.page.locator('button.navbtn[ng-click="openPanel(\'drafts\')"]').dispatchEvent('click');
        await this.page.locator('.panel--draft').waitFor();
    }

    draftPosts(): Locator {
        return this.page.locator('.panel--draft lb-post');
    }

    async openContributionsPanel(): Promise<void> {
        await this.page.locator('button.navbtn[ng-click="openPanel(\'contributions\')"]').dispatchEvent('click');
        await this.page.locator('.panel--contribution').waitFor();
    }

    contributionPosts(): Locator {
        return this.page.locator('.panel--contribution lb-post');
    }

    async publishContributionPost(index: number): Promise<void> {
        await this.contributionPosts().nth(index).hover();
        await this.contributionPosts().nth(index).locator('a[ng-click="publishPost(post)"]').click();
    }

    async editContributionPost(index: number): Promise<void> {
        await this.contributionPosts().nth(index).hover();
        await this.contributionPosts().nth(index).locator('a[ng-click="onEditClick(post)"]').click();
    }

    hasEditButtonOnContribution(index: number): Locator {
        return this.contributionPosts().nth(index).locator('a[ng-click="onEditClick(post)"]');
    }

    async filterContributionsByMember(username: string): Promise<void> {
        await this.page.locator('.panel--contribution [ng-click="self.toggleSelector()"]').click();
        await this.page.locator(`.panel--contribution [data-username="${username}"]`).click();
        await this.page.locator('.panel--contribution [ng-click="self.confirmPreselection(); self.toggleSelector()"]').click();
    }

    timelinePosts(): Locator {
        return this.page.locator('.column--timeline .timeline-posts-list:not(.pinned) lb-post');
    }

    async editTimelinePost(index: number): Promise<void> {
        await this.timelinePosts().nth(index).hover();
        await this.timelinePosts().nth(index).locator('a[ng-click="onEditClick(post)"]').click();
    }

    async openEditorPanelForFreetype(): Promise<void> {
        await this.page.locator('button.navbtn[ng-click="openPanel(\'editor\')"]').dispatchEvent('click');
        await this.page.locator('.scorecard-top').waitFor();
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
