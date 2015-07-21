var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login;

describe('General settings', function() {
    'use strict';

    // FIXME: must be uncommented after release (LBSD-546)
    // var DEFAULT_LANGUAGE = 'english',
        // NEW_LANGUAGE = 'french',
    var DEFAULT_THEME = 'Default Theme',
        NEW_THEME = 'forest';

    beforeEach(function(done) {login().then(done);});

    function expectSelected(model, value) {
        browser.waitForAngular();
        browser.wait(function() {
            return element(by.model(model)).element(by.css('option:checked')).isDisplayed();
        });
        expect(element(by.model(model)).element(by.css('option:checked')).getText()).toEqual(value);
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
    }

    function saveSettings() {
        browser.wait(function() {
            return element(by.css('[ng-click="saveSettings()"]')).isEnabled();
        });
        element(by.css('[ng-click="saveSettings()"]')).click();
    }

    // FIXME: must be uncommented after release (LBSD-546)
    // it('shows the default language', function() {
    //     openLiveblogSettings();
    //     expectSelected('liveblogSettings.language.value', DEFAULT_LANGUAGE);
    // });

    it('shows the default theme', function() {
        openLiveblogSettings();
        expectSelected('liveblogSettings.theme.value', DEFAULT_THEME);
    });

    // FIXME: must be uncommented after release (LBSD-546)
    // it('sets new language', function() {
    //     openLiveblogSettings();
    //     setSelected('liveblogSettings.language.value', NEW_LANGUAGE);
    //     saveSettings();
    //     openLiveblogSettings();
    //     expectSelected('liveblogSettings.language.value', NEW_LANGUAGE);
    // });

    it('sets new theme', function() {
        openLiveblogSettings();
        setSelected('liveblogSettings.theme.value', NEW_THEME);
        saveSettings();
        openLiveblogSettings();
        expectSelected('liveblogSettings.theme.value', NEW_THEME);
    });
});
