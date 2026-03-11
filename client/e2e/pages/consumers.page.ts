import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface Consumer {
    name: string;
    webhookUrl: string;
}

export interface Contact {
    firstName: string;
    lastName: string;
    email: string;
}

export class ConsumersPage extends BasePage {
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

    firstConsumerName(): Locator {
        return this.rows.first().getByTestId('consumer-name');
    }

    firstConsumerEmail(): Locator {
        return this.rows.first().locator('div[lb-first-contact] a');
    }

    async open(): Promise<void> {
        await this.openSection('#/syndication/');
        await this.page.getByTestId('syndication-tab-consumers').click();
    }

    async createConsumer(consumer: Consumer, contact: Contact): Promise<void> {
        await this.createButton.click();
        await this.page.locator('input#name').fill(consumer.name);
        await this.page.locator('input#webhook-url').fill(consumer.webhookUrl);
        await this.page.locator('[name="first_name"]').fill(contact.firstName);
        await this.page.locator('[name="last_name"]').fill(contact.lastName);
        await this.page.locator('[name="email"]').fill(contact.email);
        await this.saveButton.click();
    }

    async updateFirstConsumer(name: string, email: string): Promise<void> {
        const nameInput = this.page.locator('input#name');
        if (!await nameInput.isVisible()) {
            await this.rows.first().click();
        }
        await nameInput.fill(name);
        await this.page.locator('[name="email"]').first().fill(email);
        await this.saveButton.click();
    }

    async deleteFirstConsumer(): Promise<void> {
        const firstItem = this.page.locator('ul.table-body li[ng-repeat]').first();
        await firstItem.hover();
        await firstItem.locator('a.delete-consumer').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }

    async addContactToFirstConsumer(contact: Contact): Promise<void> {
        await this.rows.first().click();
        await this.page.locator('button[ng-click="addContact()"]').click();
        const newContact = this.page.locator('div[ng-repeat="contact in contacts"]').last();
        await newContact.locator('[name="first_name"]').fill(contact.firstName);
        await newContact.locator('[name="last_name"]').fill(contact.lastName);
        await newContact.locator('[name="email"]').fill(contact.email);
        await this.saveButton.click();
    }
}
