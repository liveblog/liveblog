'use strict';

//var Promise = require('bluebird');
var request = require('request');

var Webhook = function(params) {
    this.serverUrl = params.baseBackendUrl;
    this.webhookUrl = this.serverUrl + 'syndication/webhook';
    this.host = params.baseBackendUrl.match(/^http:\/\/([^/:]+)/i)[1];
    this.port = params.baseBackendUrl.match(/:(\d{4})/i)[1];
    this.username = params.username;
    this.password = params.password;
    this.auth = '';

    this.request = this.request.bind(this);
    this.login = this.login.bind(this);
    this.getSyndication = this.getSyndication.bind(this);
    this.fire = this.fire.bind(this);
};

Webhook.prototype.login = function() {
    return this.request({ 
        path: 'auth', 
        method: 'POST',
        data: {
            "username": this.username,
            "password": this.password
        }
    });
};

Webhook.prototype.getSyndication = function() {
    return this.request({
        path: 'syndication_in',
        method: 'GET'
    })
}

Webhook.prototype.request = function(params) {
    var options = {
        url: this.serverUrl + params.path,
        method: (params.hasOwnProperty('method')) ? params.method : 'GET',
        data: params.data,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        }
    };

    if (this.auth)
        options.headers['Authorization'] = this.auth;

    return browser.executeAsyncScript(function(options, cb) {
        $http = angular.injector(["ng"]).get("$http")
        $http(options)
            .then(function(data) {
                cb({ err: false, data: JSON.stringify(data) });
            })
            .catch(function(err) {
                cb({ err: err, data: null });
            })

    }, options)
    .then(function(res) {
        // Funky promises that don't catch statements
        // I'd say why not
        if (res.err)
            throw(res.err);
        else
            return JSON.parse(res.data);
    })
};

Webhook.prototype.fire = function(currentUrl) {
    console.log('fire!');
    return this.login()
        .then((body) => {
            console.log('login', body);
            this.auth = 'Basic ' + new Buffer(body.data.token + ':').toString('base64');
            return this.getSyndication();
        })
        .then((body) => {
            console.log('body get synd', body);
            return body;
        });
};

module.exports = Webhook;
