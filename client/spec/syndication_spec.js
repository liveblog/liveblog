'use strict';

var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login;
    //ingestPanel = require('./helpers/pages').EditPostPage;

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
            return element(by.css('#syndicated-blogs-list')).isDisplayed();
        });
};

describe('Syndication', function() {
    beforeEach(function(done) {login().then(done);});

    describe('Ingest Panel', function() {
        it('should display stuff', function() {
            navigateToIngestPanel()
                .then(function() {
                    return element.all(by.repeater('blog in locallySyndicatedItems'))
                        .isDisplayed();
                });
        });
    });
});
