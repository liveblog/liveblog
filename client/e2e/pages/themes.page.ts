import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class ThemesPage extends BasePage {
    readonly themeCards: Locator;

    constructor(page: Page) {
        super(page);
        this.themeCards = page.locator('.theme.card');
    }

    async open(): Promise<void> {
        await this.openSection('#/themes/');
        await this.themeCards.first().waitFor();
    }

    async isDefault(index: number): Promise<boolean> {
        return this.themeCards.nth(index).locator('.default-theme').isVisible();
    }

    async setAsDefault(index: number): Promise<void> {
        await this.themeCards.nth(index).locator('button[ng-click="self.makeDefault(theme)"]').click();
        await this.themeCards.nth(index).locator('.default-theme').waitFor({ state: 'visible' });
    }

    async openSettings(index: number): Promise<void> {
        await this.themeCards.nth(index).locator('button[ng-click="self.openThemeSettings(theme)"]').click();
        await this.page.locator('[name="postsPerPage"]').waitFor();
    }

    async getPostsPerPage(): Promise<string> {
        return this.page.locator('[name="postsPerPage"]').inputValue();
    }

    async fillPostsPerPage(value: string): Promise<void> {
        await this.page.locator('[name="postsPerPage"]').fill(value);
    }

    async saveAndCloseSettings(): Promise<void> {
        await this.page.locator('button[ng-click="vm.submitSettings(true)"]').click();
        await this.page.locator('[name="postsPerPage"]').waitFor({ state: 'hidden' });
    }
}
