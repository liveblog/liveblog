import { test, expect } from '../../fixtures/index';
import { AdvertisingPage } from '../../pages/advertising.page';

test.describe('Advertising Manager', () => {
    test('can do CRUD operations on adverts', async ({ authenticatedPage }) => {
        const page = new AdvertisingPage(authenticatedPage);
        await page.open();

        await expect(page.advertItems).toHaveCount(0);

        await page.createAdvert('Test Advert');
        await expect(page.advertItems).toHaveCount(1);

        await page.deleteFirstAdvert();
        await expect(page.advertItems).toHaveCount(0);
    });

    test('can do CRUD operations on collections', async ({ authenticatedPage }) => {
        const page = new AdvertisingPage(authenticatedPage);
        await page.open();

        await page.createAdvert('Collection Advert');

        await page.openCollectionsTab();
        await expect(page.collectionItems).toHaveCount(0);

        await page.createCollection('Test Collection');
        await expect(page.collectionItems).toHaveCount(1);

        await page.deleteFirstCollection();
        await expect(page.collectionItems).toHaveCount(0);
    });
});
