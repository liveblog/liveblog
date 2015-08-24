var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    themeManager = require('./helpers/pages').themeManager;

describe('Themes Manager', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    it('can open theme manager and list the themes', function() {
        themeManager.openThemesManager()
        .themes
        .then(function(themes) {
            expect(themes.length).toBe(3);
        });
        // angular-base
        themeManager.expectTheme(0, {number_of_blogs_expected: 0, is_default_theme:false});
        // default-theme
        themeManager.expectTheme(1, {number_of_blogs_expected: 5, is_default_theme:true});
    });
});
