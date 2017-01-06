var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    freetypesManager = require('./helpers/pages').freetypesManager,
    path = require('path');

describe('Themes Manager', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    fit('can open freetypes manager and do CRUD operations on them', function() {
        freetypesManager.openFreetypesManager();
       
        // no freetypes initialy
        expect(freetypesManager.getFreetypes().count()).toBe(0);            
        freetypesManager.createFreetype().then(function(freeData) {
            browser.waitForAngular();
            freetypesManager.createFreetype().then(function(freeData) {
                browser.waitForAngular();
                //we should not have two freetypes entered
                expect(freetypesManager.getFreetypes().count()).toBe(2);
            });
        });
        browser.sleep(4000);
    });
});
