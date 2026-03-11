import path from 'path';
import { Page, Locator } from '@playwright/test';

export class EditorPage {
    constructor(private page: Page) {}

    textBlock(): Locator {
        return this.page.locator('.st-text-block');
    }

    publishButton(): Locator {
        return this.page.locator('[ng-click="publish()"]');
    }

    saveDraftButton(): Locator {
        return this.page.locator('[ng-click="saveAsDraft()"]');
    }

    saveContributionButton(): Locator {
        return this.page.locator('[ng-click="saveAsContribution()"]');
    }

    imageBlockImg(): Locator {
        return this.page.locator('.st-block__editor img');
    }

    imageBlockError(): Locator {
        return this.page.locator('.st-msg');
    }

    async addImageBlock(imagePath: string): Promise<void> {
        await this.page.locator('.st-block-controls__top').click();
        await this.page.locator('[data-type="image"]').click();
        // Sir Trevor generates input[type="file"] for uploadable blocks; it may be hidden
        const fileInput = this.page.locator('input[type="file"]');
        await fileInput.waitFor({ state: 'attached' });
        await fileInput.setInputFiles(path.resolve(imagePath));
    }

    async typeText(text: string): Promise<void> {
        await this.textBlock().waitFor();
        await this.textBlock().click();
        await this.page.keyboard.type(text);
    }

    async saveAsDraft(): Promise<void> {
        await this.page.locator('[ng-click="saveAsDraft()"]:not([disabled])').waitFor();
        // Set up response listener before clicking — avoids stale-notification race for sequential
        // saves. Accepts PATCH too: updating an existing post uses PATCH, not POST.
        const responsePromise = this.page.waitForResponse(
            r => r.url().includes('/api/posts') && ['POST', 'PATCH'].includes(r.request().method())
        );
        await this.page.locator('[ng-click="saveAsDraft()"]').click();
        await responsePromise;
    }

    async saveAsContribution(): Promise<void> {
        await this.page.locator('[ng-click="saveAsContribution()"]:not([disabled])').waitFor();
        // Set up response listener before clicking — avoids stale-notification race for sequential
        // saves. Accepts PATCH too: updating an existing contribution uses PATCH, not POST.
        const responsePromise = this.page.waitForResponse(
            r => r.url().includes('/api/posts') && ['POST', 'PATCH'].includes(r.request().method())
        );
        await this.page.locator('[ng-click="saveAsContribution()"]').click();
        await responsePromise;
    }

    async publish(): Promise<void> {
        await this.page.locator('[ng-click="publish()"]:not([disabled])').waitFor();
        await this.page.locator('[ng-click="publish()"]').click();
        await this.page.locator('.notification-holder .alert:has-text("Post saved")').waitFor();
    }

    async resetEditor(): Promise<void> {
        await this.page.locator('[ng-click="askAndResetEditor()"]').click();
    }

    async openScorecardFreetype(): Promise<void> {
        await this.page.locator('[ng-click="toggleTypePostDialog()"]').click();
        await this.page.locator('.freetype-selector').waitFor();
        await this.page.locator('.freetype-selector li').filter({ hasText: 'Scorecard' }).click();
        await this.page.locator('.panel--editor .scorecard-top').waitFor();
    }

    scorecardInput(fieldPath: string): Locator {
        return this.page.locator(`freetype-text[text="freetypeData.${fieldPath}"] input`);
    }

    // Returns all inputs matching the given scorer iterator and field.
    // When multiple scorer rows exist, use .nth(n) to target a specific row.
    scorecardScorerInputs(iteratorN: number, field: string): Locator {
        return this.page.locator(`freetype-text[text="iterator__${iteratorN}.${field}"] input`);
    }

    async addHomeScorerRow(): Promise<void> {
        await this.page.locator('freetype-collection-add[vector="freetypeData.home.scorers"] button').click();
    }

    async addPollBlock(): Promise<void> {
        await this.page.locator('.st-block-controls__top').click();
        await this.page.locator('[data-type="poll"]').click();
        await this.page.locator('#poll_days_input').waitFor();
    }

    pollAnswerInputs(): Locator {
        return this.page.locator('.poll_option_container input[type="text"]');
    }

    async pollAddOption(): Promise<void> {
        await this.page.locator('.poll_option_add_button').click();
    }

    async pollRemoveOption(index: number): Promise<void> {
        await this.page.locator('.poll_option_remove_container').nth(index).click();
    }

    pollDaysInput(): Locator {
        return this.page.locator('#poll_days_input');
    }

    pollHoursInput(): Locator {
        return this.page.locator('#poll_hours_input');
    }

    pollMinutesInput(): Locator {
        return this.page.locator('#poll_minutes_input');
    }

    async pollReset(): Promise<void> {
        await this.page.locator('.poll_reset_button').click();
    }
}
