import { Page, Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class AdvertisingPage extends BasePage {
    readonly advertItems: Locator;
    readonly collectionItems: Locator;

    constructor(page: Page) {
        super(page);
        this.advertItems = page.locator('ul.pills-list li[ng-repeat="advert in adverts"]');
        this.collectionItems = page.locator('.flex-item.card-box[ng-repeat="collection in collections"]');
    }

    async open(): Promise<void> {
        await this.openSection('#/advertising/');
        await this.page.locator('section.advertising').waitFor();
    }

    async createAdvert(name: string): Promise<void> {
        await this.page.locator('[data-test-id="open-adverts-modal"]').click();
        await this.page.locator('ul.dropdown__menu button').filter({ hasText: 'Advertisement Remote' }).click();
        await this.page.locator('[ng-model="advert.name"]').waitFor();
        await this.page.locator('[ng-model="advert.name"]').fill(name);
        await this.page.locator('[data-test-id="modal-save-advert"]').click();
        await this.page.locator('[ng-model="advert.name"]').waitFor({ state: 'hidden' });
    }

    async deleteFirstAdvert(): Promise<void> {
        await this.advertItems.first().hover();
        await this.advertItems.first().locator('button[ng-click="removeAdvert(advert, $index);"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }

    async openCollectionsTab(): Promise<void> {
        await this.page.locator('button[ng-click="changeState(\'collections\')"]').click();
    }

    async createCollection(name: string): Promise<void> {
        await this.page.locator('button[ng-click="openCollectionDialog();"]').click();
        await this.page.locator('[ng-model="collection.name"]').waitFor();
        await this.page.locator('[ng-model="collection.name"]').fill(name);
        await this.page.locator('button[ng-click="saveCollection()"]').click();
        await this.page.locator('[ng-model="collection.name"]').waitFor({ state: 'hidden' });
        // The API dedup cache (100ms TTL) may serve the stale empty list if loadCollections
        // fires within 100ms of the previous GET. Switching tabs forces a fresh request.
        await this.page.locator('button[ng-click="changeState(\'adverts\')"]').click();
        await this.openCollectionsTab();
    }

    async deleteFirstCollection(): Promise<void> {
        await this.collectionItems.first().locator('#toggle-collection-menu').click();
        await this.page.locator('button[ng-click="removeCollection(collection, $index)"]').click();
        await this.page.locator('button[ng-click="ok()"]').click();
    }
}
