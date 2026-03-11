import { test, expect } from '../../fixtures';
import { ProducersPage, Producer, Contact } from '../../pages/producers.page';

const ORIGINAL_COUNT = 25;
const INITIAL_FIRST_PRODUCER = 'John Deere';

const producer: Producer = {
    name: 'Massey Fergusson',
    apiUrl: 'https://www.masseyferguson.de/api',
    consumerApiKey: '1234567890qwerty',
};

const contact: Contact = {
    firstName: 'Chuck',
    lastName: 'Norris',
    email: 'gmail@chucknorris.com',
};

test('displays the producers list', async ({ authenticatedPage }) => {
    const producers = new ProducersPage(authenticatedPage);
    await producers.open();

    await expect(producers.rows).toHaveCount(ORIGINAL_COUNT);
});

test('paginates to page 2', async ({ authenticatedPage }) => {
    const producers = new ProducersPage(authenticatedPage);
    await producers.open();
    await producers.paginationNext.click();

    await expect(producers.rows).toHaveCount(11);
});

test('shows validation errors when required fields are empty', async ({ authenticatedPage }) => {
    const producers = new ProducersPage(authenticatedPage);
    await producers.open();
    await producers.createButton.click();

    await authenticatedPage.locator('input#name').fill(producer.name);
    await authenticatedPage.locator('[name="first_name"]').fill(contact.firstName);
    await producers.saveButton.click();

    await expect(authenticatedPage.locator('[ng-show="producerForm.attempted && producerForm.api_url.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="attempted && contactForm.last_name.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="attempted && contactForm.email.$error.required"]')).toBeVisible();
    await expect(authenticatedPage.locator('[ng-show="attempted && contactForm.first_name.$error.required"]')).not.toBeVisible();
});

test('creates a new producer', async ({ authenticatedPage }) => {
    const producers = new ProducersPage(authenticatedPage);
    await producers.open();
    await producers.createProducer(producer, contact);

    await expect(producers.rows).toHaveCount(ORIGINAL_COUNT + 1);
    await expect(producers.firstProducerName()).toHaveText(producer.name);
});

test('updates a producer', async ({ authenticatedPage }) => {
    const producers = new ProducersPage(authenticatedPage);
    await producers.open();

    await expect(producers.firstProducerName()).toHaveText(INITIAL_FIRST_PRODUCER);

    await producers.updateFirstProducer(producer.name, contact.email);
    await expect(producers.firstProducerName()).toHaveText(producer.name);
    await expect(producers.firstProducerEmail()).toHaveText(contact.email);
    await expect(producers.rows).toHaveCount(ORIGINAL_COUNT);
});

test('deletes a producer', async ({ authenticatedPage }) => {
    const producers = new ProducersPage(authenticatedPage);
    await producers.open();

    await expect(producers.firstProducerName()).toHaveText(INITIAL_FIRST_PRODUCER);

    await producers.deleteFirstProducer();
    await expect(producers.rows).toHaveCount(ORIGINAL_COUNT - 1);
});
