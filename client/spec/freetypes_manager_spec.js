var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    freetypesManager = require('./helpers/pages').freetypesManager;

describe('Free types Manager', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });


    it('can open freetypes manager and do CRUD operations on them', function() {
        freetypesManager.openFreetypesManager();
        // no freetypes initialy
        expect(freetypesManager.getFreetypes().count()).toBe(0);
        freetypesManager.openNewFreetypeDialog();
        freetypesManager.editFreetype().then(function(freeData) {
            //we should not have two freetypes entered
            expect(freetypesManager.getFreetypes().count()).toBe(1);
            //open 1st freetype and check contents
            freetypesManager.getFreetypes().get(0).click().all(by.css('[ng-click="vm.openFreetypeDialog(freetype);"]')).click();
            expect(freetypesManager.title.getAttribute('value')).toEqual(freeData.title);
            expect(freetypesManager.template.getAttribute('value')).toEqual(freeData.template);

            //edit freetype
            var newData = freetypesManager.createFreetypeData();
            freetypesManager.title.sendKeys(newData.title);
            freetypesManager.template.sendKeys(newData.template);
            freetypesManager.saveFreetype().then(function() {
                //check the new contents to match
                freetypesManager.getFreetypes().get(0).click().all(by.css('[ng-click="vm.openFreetypeDialog(freetype);"]')).click();
                expect(freetypesManager.title.getAttribute('value')).toEqual(freeData.title + newData.title);
                expect(freetypesManager.template.getAttribute('value')).toEqual(freeData.template + newData.template);
            });
            //close edit freetype dialog
            element(by.css('[ng-click="vm.cancelCreate()"]')).click();
            //remove first freetype
            freetypesManager.removeFreetype(0);
            // expect no freetypes available
            expect(freetypesManager.getFreetypes().count()).toBe(0);

        });
    });
});
