import { test, expect } from '../../fixtures';
import { ConsumersPage, Consumer, Contact } from '../../pages/consumers.page';

const ORIGINAL_COUNT = 25;
const INITIAL_FIRST_CONSUMER = 'John Deere';

const consumer: Consumer = {
    name: 'Massey Fergusson',
    webhookUrl: 'https://www.masseyferguson.de/api/syndication/webhook',
};

const contact: Contact = {
    firstName: 'Jean',
    lastName: 'Pierre',
    email: 'jean.pierre@gmail.com',
};

const contact2: Contact = {
    firstName: 'Paul',
    lastName: 'Sabatier',
    email: 'paul.sabatier@gmail.com',
};

test('displays the consumers list', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();

    await expect(consumers.rows).toHaveCount(ORIGINAL_COUNT);
});

test('paginates to page 2', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();
    await consumers.paginationNext.click();

    await expect(consumers.rows).toHaveCount(11);
});

test('shows validation errors when required fields are empty', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();
    await consumers.createButton.click();

    await authenticatedPage.locator('[name="first_name"]').fill(contact.firstName);
    await consumers.saveButton.click();

    await expect(authenticatedPage.locator('[ng-show="consumerForm.attempted && consumerForm.name.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="consumerForm.attempted && consumerForm.webhook_url.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="attempted && contactForm.last_name.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="attempted && contactForm.email.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="attempted && contactForm.first_name.$error.required"]')).not.toBeVisible();
});

test('creates a new consumer', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();
    await consumers.createConsumer(consumer, contact);

    await expect(consumers.rows).toHaveCount(ORIGINAL_COUNT + 1);
    await expect(consumers.firstConsumerName()).toHaveText(consumer.name);
});

test('updates a consumer', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();

    await expect(consumers.firstConsumerName()).toHaveText(INITIAL_FIRST_CONSUMER);

    await consumers.updateFirstConsumer(consumer.name, contact.email);
    await expect(consumers.firstConsumerName()).toHaveText(consumer.name);
    await expect(consumers.firstConsumerEmail()).toHaveText(contact.email);
    await expect(consumers.rows).toHaveCount(ORIGINAL_COUNT);
});

test('deletes a consumer', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();

    await expect(consumers.firstConsumerName()).toHaveText(INITIAL_FIRST_CONSUMER);

    await consumers.deleteFirstConsumer();
    await expect(consumers.rows).toHaveCount(ORIGINAL_COUNT - 1);
});

test('adds a contact to an existing consumer', async ({ authenticatedPage }) => {
    const consumers = new ConsumersPage(authenticatedPage);
    await consumers.open();

    await expect(consumers.firstConsumerName()).toHaveText(INITIAL_FIRST_CONSUMER);

    await consumers.addContactToFirstConsumer(contact2);
    await expect(consumers.rows).toHaveCount(ORIGINAL_COUNT);
});
