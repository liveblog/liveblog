var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;

describe('Blog settings', function() {
    'use strict';

    var DEFAULT_LANGUAGE = 'english';
    var NEW_LANGUAGE = 'french';

    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});

    function openSettings() {
        // click on the settings button
        element(by.css('.settings-link')).click();
    }

    function expectSelectedLanguageIs(language) {
        expect(element(by.model('settings.blogPreferences.language')).$('option:checked').getText()).toEqual(language);
    }

    function setLanguage(language) {
        element(by.model('settings.blogPreferences.language')).sendKeys(language);
    }

    it('shows the default language selected', function() {
        openBlog(0);
        openSettings();
        expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    });

    it('save a new value for language', function() {
        openBlog(0);
        openSettings();
        setLanguage(NEW_LANGUAGE);
        // save
        element(by.css('[ng-click="settings.save()"]')).click();
        openSettings();
        expectSelectedLanguageIs(NEW_LANGUAGE);
    });

    it('reset default language value', function() {
        openBlog(0);
        openSettings();
        setLanguage(NEW_LANGUAGE);
        // save a new value
        element(by.css('[ng-click="settings.save()"]')).click();
        openSettings();
        expectSelectedLanguageIs(NEW_LANGUAGE);
        // reset
        element(by.css('[ng-click="settings.reset()"]')).click();
        expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    });

    it('cancel changed language', function() {
        openBlog(0);
        openSettings();
        setLanguage(NEW_LANGUAGE);
        // cancel
        element(by.css('[ng-click="settings.close()"]')).click();
        openSettings();
        expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    });
    it('shows original creator full name and username', function() {
        openBlog(0);
        openSettings();
        element(by.css('[data="blog-settings-users"]')).click();
        //expect original creator name
        element(by.css('[data="original-creator-display-name"]')).getText().then(function(text) {
            expect(text).toEqual('first name last name');
        });
        element(by.css('[data="original-creator-username"]')).getText().then(function(text) {
            expect(text).toEqual('test_user');
        });
    });

});
