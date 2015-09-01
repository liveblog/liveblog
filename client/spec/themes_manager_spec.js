var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    themeManager = require('./helpers/pages').themeManager,
    path = require('path');

describe('Themes Manager', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    it('can open theme manager and list the themes', function() {
        themeManager.openThemesManager()
        .themes
        .then(function(themes) {
            expect(themes.length).toBe(3);
            // angular-base
            themeManager.expectTheme(0, {number_of_blogs_expected: 0, is_default_theme:false, name: 'Angular Base'});
            // default-theme
            themeManager.expectTheme(1, {number_of_blogs_expected: 5, is_default_theme:true, name: 'Default Theme'});
            // forest
            themeManager.expectTheme(2, {number_of_blogs_expected: 0, is_default_theme:false, name: 'forest'});
        });
    });

    it('can set a theme as default', function() {
        themeManager.openThemesManager()
        .setAsDefault(2)
        .then(function() {
            // forest
            themeManager.expectTheme(2, {number_of_blogs_expected: 0, is_default_theme:true, name: 'forest'});
            // default-theme
            themeManager.expectTheme(1, {number_of_blogs_expected: 5, is_default_theme:false, name: 'Default Theme'});
        });
    });

    it('can upload a new theme', function() {
        themeManager.openThemesManager()
            .fileThemeElement.sendKeys(path.resolve(__dirname) + '/upload/dog-theme.zip');
        browser.waitForAngular();
        themeManager.themes.then(function(themes) {
            expect(themes.length).toBe(4);
            // actual-dog
            themeManager.expectTheme(1, {number_of_blogs_expected: 0, is_default_theme:false, name: 'Actual Dog'});
        });
    });

        it('can remove a theme', function() {
        themeManager.openThemesManager()
        .themes
        .then(function(themes) {
            // removing forest theme
            themeManager.remove(2);
            themeManager.openThemesManager()
            .themes.then(function(newThemes) {
                expect(themes.length).not.toEqual(newThemes.length);
            });
        });
    });
});
