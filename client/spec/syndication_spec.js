'use strict';

// var Webhook = require('./helpers/webhook');
var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login;
    //assertToastMsg = require('./helpers/assert-toast-msg');

// var webhook = new Webhook(browser.params);

var navigateToIngestPanel = function() {
    return element.all(by.repeater('blog in blogs._items track by blog._id'))
        .get(3)
        .click()
        .then(function() {
            return element(by.css('button[ng-click="openPanel(\'ingest\')"]')).isDisplayed();
        })
        .then(function() {
            return element(by.css('button[ng-click="openPanel(\'ingest\')"]')).click();
        })
        .then(function() {
            return element(by.css('.syndicated-blogs-list')).isDisplayed();
        });
};

describe('Syndication', function() {
    beforeEach(function(done) {
        browser.ignoreSynchronization = true;
        login()
            .then(() => browser.ignoreSynchronization = false)
            .then(done);
    });

    describe('Ingest Panel', function() {
        it('should list available syndications', function() {
            navigateToIngestPanel()
                .then(function() {
                    return element.all(by.repeater('blog in locallySyndicatedItems'))
                        .isDisplayed();
                })
                .then(function() {
                    return element.all(by.repeater('blog in locallySyndicatedItems'))
                        .count();
                })
                .then(function(count) {
                    expect(count).toEqual(1);
                });
        });

        // TODO: I'm deactivating this for now because of the avant-garde of the approach, 
        // should be fixed in the future.
        //it('should display an incoming syndication and delete it', function() {
        // TODO: Update the webhook query in order to avoid error 400
        //fit('should display an incoming syndication and delete it', function() {
        //    navigateToIngestPanel()
        //        .then(function() {
        //            return element.all(by.repeater('blog in locallySyndicatedItems'))
        //                .isDisplayed();
        //        })
        //        .then(function() {
        //            return element.all(by.repeater('blog in locallySyndicatedItems'))
        //                .get(0)
        //                .click();
        //        })
        //        .then(function() {
        //            return element(by.css('div.panel__incoming-syndication'))
        //                .isDisplayed();
        //        })
        //        .then(function() {
        //            return webhook.fire();
        //        })
        //        .then(function() {
        //            return element.all(by.repeater('post in posts._items'))
        //                .get(0)
        //                .isDisplayed();
        //        })
        //        .then(function() {
        //            return element.all(by.repeater('post in posts._items'))
        //                .get(0)
        //                .element(by.css('a[ng-click="askRemove(post)"]'))
        //                .click();
        //        })
        //        .then(function() {
        //            return element(by.css('div.modal-footer button[ng-click="ok()"]'))
        //                .isDisplayed();
        //        })
        //        .then(function() {
        //            return element(by.css('div.modal-footer button[ng-click="ok()"]'))
        //                .click();
        //        })
        //        .then(function() {
        //            return element.all(by.repeater('post in posts._items'))
        //                .count();
        //        })
        //        .then(function(count) {
        //            expect(count).toEqual(0);
        //        });
        //});
    });
});
