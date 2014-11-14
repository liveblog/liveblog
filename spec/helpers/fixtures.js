'use strict';

var backendRequestAuth = require('./backend').backendRequestAuth;

exports.resetApp = resetApp;

function resetApp(callback) {
    backendRequestAuth({
        uri: '/prepopulate',
        method: 'POST',
        json: {
            'profile': 'test'
        }
    }, function(e, r, j) {
        callback(e, r, j);
    });
}
