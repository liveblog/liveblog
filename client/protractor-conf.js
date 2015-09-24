'use strict';

exports.config = {
    allScriptsTimeout: 30000,
    baseUrl: 'http://localhost:9000',
    params: {
        baseBackendUrl: 'http://localhost:5000/api/',
        username: 'admin',
        password: 'admin'
    },
    specs: ['spec/**/*[Ss]pec.js'],
    capabilities: {
        browserName: 'chrome',
        chromeOptions: {
            args: ['--no-sandbox']
        }
    },
    directConnect: true,
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true,
        isVerbose: true,
        includeStackTrace: true,
        defaultTimeoutInterval: 240000
    },
    /* global jasmine */
    onPrepare: function() {
        /*
        var ScreenShotReporter = require('protractor-screenshot-reporter');
        jasmine.getEnv().addReporter(new ScreenShotReporter({
            baseDirectory: './screenshots',
            pathBuilder:
                function pathBuilder(spec, descriptions, results, capabilities) {
                    return results.passed() + '_' + descriptions.reverse().join('-');
                },
            takeScreenShotsOnlyForFailedSpecs: true
        }));
        */
        var setup = require('./app/scripts/bower_components/superdesk/client/spec/helpers/setup');
        setup({fixture_profile: 'test'});
        require('jasmine-reporters');
        jasmine.getEnv().addReporter(
            new jasmine.JUnitXmlReporter('e2e-test-results', true, true)
        );
    }
};
