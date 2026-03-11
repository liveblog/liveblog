import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class FreetypesPage extends BasePage {
    readonly freetypeItems: Locator;

    constructor(page: Page) {
        super(page);
        this.freetypeItems = page.locator('ul.pills-list li[ng-repeat="freetype in self.freetypes"]');
    }

    async open(): Promise<void> {
        await this.openSection('#/freetypes/');
        await this.page.locator('button[ng-click="self.openFreetypeDialog();"]').waitFor();
    }

    async createFreetype(name: string, template: string): Promise<void> {
        await this.page.locator('button[ng-click="self.openFreetypeDialog();"]').click();
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').waitFor();
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').fill(name);
        await this.page.locator('textarea[ng-model="self.dialogFreetype.template"]').fill(template);
        await this.page.locator('button[ng-click="self.saveFreetype()"]').click();
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').waitFor({ state: 'hidden' });
    }

    async openFirstFreetypeEdit(): Promise<void> {
        await this.freetypeItems.first().hover();
        await this.freetypeItems.first().locator('button[ng-click="self.openFreetypeDialog(freetype);"]').click();
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').waitFor();
    }

    async getDialogName(): Promise<string> {
        return this.page.locator('[ng-model="self.dialogFreetype.name"]').inputValue();
    }

    async getDialogTemplate(): Promise<string> {
        return this.page.locator('textarea[ng-model="self.dialogFreetype.template"]').inputValue();
    }

    async fillDialogName(value: string): Promise<void> {
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').fill(value);
    }

    async fillDialogTemplate(value: string): Promise<void> {
        await this.page.locator('textarea[ng-model="self.dialogFreetype.template"]').fill(value);
    }

    async saveDialog(): Promise<void> {
        await this.page.locator('button[ng-click="self.saveFreetype()"]').click();
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').waitFor({ state: 'hidden' });
    }

    async cancelDialog(): Promise<void> {
        await this.page.getByRole('button', { name: 'Cancel' }).click();
        await this.page.locator('[ng-model="self.dialogFreetype.name"]').waitFor({ state: 'hidden' });
    }

    async deleteFirstFreetype(): Promise<void> {
        await this.freetypeItems.first().hover();
        await this.freetypeItems.first().locator('button[ng-click="self.removeFreetype(freetype, $index);"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }
}
