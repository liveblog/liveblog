import { Page, Locator } from '@playwright/test';

export class TimelinePage {
    constructor(private page: Page) {}

    posts(): Locator {
        return this.page.locator('.column--timeline .timeline-posts-list:not(.pinned) lb-post');
    }

    post(index: number): Locator {
        return this.posts().nth(index);
    }

    postText(index: number): Locator {
        return this.post(index).locator('[lb-bind-html]').first();
    }

    postAuthor(index: number): Locator {
        return this.post(index).locator('.lb-post__header span.name').first();
    }

    async deletePost(index: number): Promise<void> {
        await this.post(index).hover();
        await this.post(index).locator('a[ng-click="askRemovePost(post)"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }

    async editPost(index: number): Promise<void> {
        await this.post(index).hover();
        await this.post(index).locator('a[ng-click="onEditClick(post)"]').click();
    }

    async highlightPost(index: number): Promise<void> {
        await this.post(index).hover();
        await this.post(index).locator('a[ng-click="highlightPost(post)"]').click();
    }

    postHighlightIcon(index: number): Locator {
        return this.post(index).locator('a[ng-click="highlightPost(post)"] i.icon-star');
    }

    async pinPost(index: number): Promise<void> {
        await this.post(index).hover();
        await this.post(index).locator('a[ng-click="togglePinStatus(post)"]').click();
    }

    async unpublishPost(index: number): Promise<void> {
        await this.post(index).hover();
        await this.post(index).locator('a[ng-click="unpublishPost(post)"]').click();
    }

    async startReorder(index: number): Promise<void> {
        await this.post(index).hover();
        await this.post(index).locator('a[ng-click="preMovePost(post);"]').click();
    }

    async moveAbove(index: number): Promise<void> {
        await this.post(index).locator('div.timeline-reorder[ng-click="movePost(index, \'above\');"]').click();
    }

    canReorderLocator(index: number): Locator {
        return this.post(index).locator('a[ng-click="preMovePost(post);"]');
    }

    reorderDisabledLocator(index: number): Locator {
        return this.post(index).locator('div.reorder-disabled');
    }

    pinDrawer(): Locator {
        return this.page.locator('[data-test-id="timeline-posts-pinned"]');
    }

}
