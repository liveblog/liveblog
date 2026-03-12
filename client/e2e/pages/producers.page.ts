import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { Contact } from './consumers.page';

export interface Producer {
    name: string;
    apiUrl: string;
    consumerApiKey: string;
}

export { Contact };

export class ProducersPage extends BasePage {
    readonly rows: Locator;
    readonly createButton: Locator;
    readonly saveButton: Locator;
    readonly paginationNext: Locator;

    constructor(page: Page) {
        super(page);
        this.rows = page.locator('ul.table-body div.row-wrapper');
        this.createButton = page.locator('button.sd-create-btn');
        this.saveButton = page.locator('#save-edit-btn');
        this.paginationNext = page.locator('button[ng-click="setPage(page + 1)"]');
    }

    firstProducerName(): Locator {
        return this.rows.first().locator('div.name');
    }

    firstProducerEmail(): Locator {
        return this.rows.first().locator('div[lb-first-contact] a');
    }

    async open(): Promise<void> {
        await this.openSection('#/syndication/');
        await this.page.getByTestId('syndication-tab-producers').click();
    }

    async createProducer(producer: Producer, contact: Contact): Promise<void> {
        await this.createButton.click();
        await this.page.locator('input#name').fill(producer.name);
        await this.page.locator('input#api-url').fill(producer.apiUrl);
        await this.page.locator('input#consumer-api-key').fill(producer.consumerApiKey);
        await this.page.locator('[name="first_name"]').fill(contact.firstName);
        await this.page.locator('[name="last_name"]').fill(contact.lastName);
        await this.page.locator('[name="email"]').fill(contact.email);
        await this.saveButton.click();
    }

    async updateFirstProducer(name: string, email: string): Promise<void> {
        const nameInput = this.page.locator('input#name');
        if (!await nameInput.isVisible()) {
            await this.rows.first().click();
        }
        await nameInput.fill(name);
        await this.page.locator('[name="email"]').first().fill(email);
        await this.saveButton.click();
    }

    async deleteFirstProducer(): Promise<void> {
        const firstItem = this.page.locator('ul.table-body li[ng-repeat]').first();
        await firstItem.hover();
        await firstItem.locator('a.delete-producer').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }
}
