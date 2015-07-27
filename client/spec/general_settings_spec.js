var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    generalSettings = require('./helpers/pages').generalSettings;

describe('General settings', function() {
    'use strict';

    // FIXME: must be uncommented after release (LBSD-546)
    // var DEFAULT_LANGUAGE = 'english',
        // NEW_LANGUAGE = 'french',
    var DEFAULT_THEME = 'Default Theme',
        NEW_THEME = 'forest';

    beforeEach(function(done) {login().then(done);});

    // FIXME: must be uncommented after release (LBSD-546)
    // it('shows the default language', function() {
    //     openLiveblogSettings();
    //     expectSelected('liveblogSettings.language.value', DEFAULT_LANGUAGE);
    // });

    it('shows the default theme', function() {
        generalSettings.open().expectTheme(DEFAULT_THEME);
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
        generalSettings.open()
                        .setTheme(NEW_THEME)
                        .save()
                        .open()
                        .expectTheme(NEW_THEME);
    });
});
