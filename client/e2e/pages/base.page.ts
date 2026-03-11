import { Page } from '@playwright/test';

export class BasePage {
    constructor(protected page: Page) {}

    async openSection(href: string) {
        await this.page.locator('[ng-click="toggleMenu()"]').click();
        await this.page.locator(`[href="${href}"][title]`).click();
    }
}
