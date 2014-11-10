'use strict';

var ScreenShotReporter = require('protractor-screenshot-reporter');

var frontendServerUrl = 'https://liveblog.sd-test.sourcefabric.org';
var backendServerHostname = 'liveblog.sd-test.sourcefabric.org';

exports.config = {
    params: {

        maxTimeout: 120 * 1000,

        baseUrl: frontendServerUrl,
        blogId: '1',
        baseGetParams: {},

        backendServerHostname: backendServerHostname,
        baseBackendUrl: 'https://' + backendServerHostname + '/api/',
        username: 'admin',
        password: 'admin'

    },
    specs: ['spec/setup.js', 'spec/matchers.js', 'spec/**/*[Ss]pec.js'],
    capabilities: {
        browserName: 'chrome'
    },
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true,
        isVerbose: false,
        includeStackTrace: false,
        defaultTimeoutInterval: 30000
    },
    /* global jasmine */
    onPrepare: function() {
        jasmine.getEnv().addReporter(new ScreenShotReporter({
            baseDirectory: './screenshots',
            pathBuilder:
                function pathBuilder(spec, descriptions, results, capabilities) {
                    return results.passed() + '_' + descriptions.reverse().join('-');
                },
            takeScreenShotsOnlyForFailedSpecs: true
        }));
        require('jasmine-reporters');
        jasmine.getEnv().addReporter(
            new jasmine.JUnitXmlReporter('e2e-test-results', true, true)
        );
    }
};
