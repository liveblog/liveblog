var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    aM = require('./helpers/pages').advertisingManager;

describe('Advertising Manager', () => {
    beforeEach((done) => {
        browser.driver.manage().window().maximize();
        login()
            .then(done);
    });


    it('can open Adverts manager and do CRUD operations on them', () => {
        aM.openAdvertisingManager();

        // advert tab should be open by default
        // no adverts initialy
        expect(aM.getAdverts().count()).toBe(0);

        aM.openNewAdvertDialog();
        aM.editAdvert().then((freeData) => {
            // we should not have two freetypes entered
            expect(aM.getAdverts().count()).toBe(1);
            // open 1st freetype and check contents
            aM.openAdvertModal();

            expect(aM.advertTitle().getAttribute('value')).toEqual(freeData.title);
            expect(aM.advertEmbed().getAttribute('value')).toEqual(freeData.embed);

            // edit freetype
            var newData = aM.createAdvertData();

            aM.advertTitle().sendKeys(newData.title);
            aM.advertEmbed().sendKeys(newData.embed);
            aM.saveAdvert().then(() => {
                // check the new contents to match
                aM.getAdverts().get(0)
                    .click()
                    .all(by.css('[ng-click="openAdvertDialog(advert);"]'))
                    .click();
                expect(aM.advertTitle().getAttribute('value')).toEqual(freeData.title + newData.title);
                expect(aM.advertEmbed().getAttribute('value')).toEqual(freeData.embed + newData.embed);
            });
            // close edit freetype dialog
            element(by.testId('modal-cancel-advert-create')).click();
            // remove first freetype
            aM.removeAdvert(0);
            // expect no freetypes available
            expect(aM.getAdverts().count()).toBe(0);
        });
    });

    it('can open Collections manager tab and do CRUD operations on them', () => {
        aM.openAdvertisingManager();

        // create an advert so we can add it to the collection
        aM.openNewAdvertDialog();
        aM.editAdvert().then((freeData) => {
            // open the collections tab
            aM.openCollectionsTab();
            aM.openNewCollectionDialog();
            aM.editCollection().then((freeData) => {
                // we should now have one collection
                expect(aM.getCollections().count()).toBe(1);
                // open 1st collection and check contents

                aM.getCollections().get(0)
                    .all(by.id('toggle-collection-menu')).
                    click();
                element(by.css('[ng-click="openCollectionDialog(collection)"]'))
                    .click();

                expect(aM.collectionTitle().getAttribute('value')).toEqual(freeData.title);

                // edit collection
                var newData = aM.createAdvertData();

                aM.collectionTitle().sendKeys(newData.title);

                // add one advert
                aM.getAdverts().get(0)
                    .all(by.css('[type="checkbox"]'))
                    .click();

                aM.saveCollection().then(() => {
                    // check the new contents to match
                    var newTitle = freeData.title + newData.title;

                    newTitle = newTitle.toUpperCase();
                    expect(element(by.id('collection-name')).getText()).toEqual(newTitle);
                    // expect to have one advert added
                    expect(aM.getAdverts().count()).toBe(1);
                });

                // remove first collection
                aM.removeCollection(0);

                // expect no collections available
                expect(aM.getCollections().count()).toBe(0);
            });
        });
    });
});
