'use strict';

const request = require('request');

var Webhook = function(params) {
    this.serverUrl = params.baseBackendUrl;
    this.webhookUrl = this.serverUrl + 'syndication/webhook';
    this.host = params.baseBackendUrl.match(/^http:\/\/([^/:]+)/i)[1];
    this.port = params.baseBackendUrl.match(/:(\d{4})/i)[1];
    this.username = params.username;
    this.password = params.password;
    this.token = '';

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
        json: params.data,
        headers: {
            "Content-Type": "application/json;charset=UTF-8"
        }
    };

    if (this.token)
        options.headers['Authentication'] = 'Basic ' + this.token;

    return new Promise(function(resolve, reject) {
        request(options, function(err, response, body) {
            console.log(response);
            //console.log(err, body);
            if (err)
                reject(err);
            else
                resolve(body);
        });
    });
};

Webhook.prototype.fire = function(currentUrl) {
    return this.login()
        .then((body) => {
            console.log('token', body.token);
            this.token = body.token;
            return this.getSyndication();
        })
        .then((body) => {
            console.log('body get synd', body);
        })
        .catch(function(err) {
            console.log('err', err);
        });
};

module.exports = Webhook;
