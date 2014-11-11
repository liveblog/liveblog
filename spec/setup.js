'use strict';

/*global beforeEach, afterEach */

var getToken = require('./helpers/auth').getToken;
var resetApp = require('./helpers/fixtures').resetApp;

// runs before every spec
beforeEach(function(done) {
    // see https://github.com/angular/protractor/blob/master/docs/timeouts.md
    // if not using angular:
    //browser.ignoreSynchronization = true;
    // for angular:
    getToken(function() {
        resetApp(function() {
            browser.get('/');
            browser.executeScript('sessionStorage.clear();localStorage.clear();');
            protractor.getInstance().waitForAngular();
            done();
        });
    });
});

// runs after every spec
afterEach(function() {});
