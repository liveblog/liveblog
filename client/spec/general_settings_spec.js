var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login;

describe('General settings', function() {
    'use strict';

    var DEFAULT_LANGUAGE = 'english',
        NEW_LANGUAGE = 'french',
        DEFAULT_THEME = 'ocean',
        NEW_THEME = 'forest';

    beforeEach(function(done) {login().then(done);});

    function expectSelected(model, value) {
        expect(element(by.model(model)).$('option:checked').getText()).toEqual(value);
    }

    function setSelected(model, value) {
        element(by.model(model)).sendKeys(value);
    }

    function openLiveblogSettings() {
        element(by.css('[ng-click="toggleMenu()"]')).click();
        browser.wait(function() {
            return element(by.css('[href="#/settings"]')).isDisplayed();
        });
        element(by.css('[href="#/settings"]')).click();
        browser.wait(function() {
            return element(by.css('[href="#/settings/liveblog"]')).isDisplayed();
        });
        element(by.css('[href="#/settings/liveblog"]')).click();
    }

    function saveSettings() {
        browser.wait(function() {
            return element(by.css('[ng-click="saveSettings()"]')).isEnabled();
        });
        element(by.css('[ng-click="saveSettings()"]')).click();
    }

    it('shows the default language', function() {
        openLiveblogSettings();
        expectSelected('liveblogSettings.language.value', DEFAULT_LANGUAGE);
    });

    it('shows the default theme', function() {
        openLiveblogSettings();
        expectSelected('liveblogSettings.theme.value', DEFAULT_THEME);
    });

    it('sets new language', function() {
        openLiveblogSettings();
        setSelected('liveblogSettings.language.value', NEW_LANGUAGE);
        saveSettings();
        openLiveblogSettings();
        expectSelected('liveblogSettings.language.value', NEW_LANGUAGE);
    });

    it('sets new theme', function() {
        openLiveblogSettings();
        setSelected('liveblogSettings.theme.value', NEW_THEME);
        saveSettings();
        openLiveblogSettings();
        expectSelected('liveblogSettings.theme.value', NEW_THEME);
    });
});
