var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    aM = require('./helpers/pages').advertisingManager;

describe('Advertising Manager', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });


    fit('can open Adverts manager and do CRUD operations on them', function() {
        aM.openAdvertisingManager();

        // advert tab should be open by default
        // no adverts initialy

        expect(aM.getAdverts().count()).toBe(0);
        
        aM.openNewAdvertDialog();
        aM.editFreetype().then(function(freeData) {
            //we should not have two freetypes entered
            expect(aM.getdverts().count()).toBe(1);
            //open 1st freetype and check contents
            aM.getdverts().get(0).click().all(by.css('[ng-click="openAdvertDialog(advert);"]')).click();
            expect(aM.advertTitle.getAttribute('value')).toEqual(freeData.title);
            expect(aM.advertEmbed.getText()).toEqual(freeData.embed);

            //edit freetype
            var newData = aM.createAdvertData();
            aM.title.sendKeys(newData.title);
            aM.embed.sendKeys(newData.embed);
            aM.saveAdvert().then(function() {
                //check the new contents to match
                aM.getAdverts().get(0).click().all(by.css('[ng-click="vm.openAdvertDialog(advert);"]')).click();
                expect(aM.title.getAttribute('value')).toEqual(freeData.title + newData.title);
                expect(aM.embed.getText()).toEqual(newData.embed + freeData.embed);
            });
            //close edit freetype dialog
            element(by.css('[ng-click="vm.cancelAdvertCreate()"]')).click();
            //remove first freetype
            aM.removeFreetype(0);
            // expect no freetypes available
            expect(aM.getFreetypes().count()).toBe(0);

        });
    });
});
