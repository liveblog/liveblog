'use strict';

var path = require('path');

function getChromeOptions() {
    var chromeOptions = {
        args: ['no-sandbox']
    };

    if (process.env.CHROME_BIN) {
        chromeOptions.binary = process.env.CHROME_BIN;
    }

    //chromeOptions.binary = '/usr/bin/chromium-browser';

    return chromeOptions;
}

var config = {
    allScriptsTimeout: 34000,
    baseUrl: 'http://localhost:9000',
    params: {
        baseBackendUrl: 'http://localhost:5000/api/',
        username: 'admin',
        password: 'admin'
    },

    suites: {
        a: path.join(__dirname, '/spec/**/[a-f]*[Ss]pec.js'),
        b: path.join(__dirname, '/spec/**/[g-m]*[Ss]pec.js'),
        c: path.join(__dirname, '/spec/**/[n-z]*[Ss]pec.js')
    },

    framework: 'jasmine2',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 200000
    },

    capabilities: {
        browserName: 'chrome',
        chromeOptions: getChromeOptions()
    },

    onPrepare: function() {
        require('./node_modules/superdesk-core/spec/helpers/setup')({fixture_profile: 'test'});
        var reporters = require('jasmine-reporters');
        jasmine.getEnv().addReporter(
            new reporters.JUnitXmlReporter({
                savePath: 'e2e-test-results',
                consolidateAll: true
            })
        );
        function CustomReporter() {
            this.specDone = function(result) {
                if (result.failedExpectations.length > 0) {
                    var name = result.fullName.split(' ');
                    console.log('at ' + name[0] + ': ' + result.description);
                }
            };
        }
        jasmine.getEnv().addReporter(new CustomReporter());
    }
};

exports.config = config;
