'use strict';

var getToken = require('./auth').getToken;

var backendRequestAuth = require('./backend').backendRequestAuth;

exports.resetApp = resetApp;

function resetApp(callback) {
    backendRequestAuth({
        uri: '/prepopulate',
        method: 'POST',
        json: {
            'Name': 'default',
            'ApplyOnDatabase': true,
            'ApplyOnFiles': true
        }
    }, function(e, r, j) {
        getToken(function(e2, r2, j2) {
            //console.log(j2);
            callback(e, r, j);
        });
    });
}
