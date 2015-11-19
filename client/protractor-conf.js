function getChromeOptions() {
    'use strict';

    var chromeOptions = {
        args: ['no-sandbox']
    };

    if (process.env.CHROME_BIN) {
        chromeOptions.binary = process.env.CHROME_BIN;
    }

    return chromeOptions;
}

exports.config = {
    baseUrl: 'http://localhost:9090',
    params: {
        baseBackendUrl: 'http://localhost:5000/api/',
        username: 'admin',
        password: 'admin'
    },

    specs: ['spec/**/*[Ss]pec.js'],

    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 120000
    },

    capabilities: {
        browserName: 'chrome',
        chromeOptions: getChromeOptions()
    },

    directConnect: true,

    onPrepare: function() {
        'use strict';

        var setup = require('./app/scripts/bower_components/superdesk/client/spec/helpers/setup');
        setup({fixture_profile: 'test'});

        var reporters = require('jasmine-reporters');
        jasmine.getEnv().addReporter(
            new reporters.JUnitXmlReporter({
                savePath: 'e2e-test-results',
                consolidateAll: true
            })
        );
    }
};
