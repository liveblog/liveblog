'use strict';

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
    this.incomingPost = this.incomingPost.bind(this);
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

Webhook.prototype.incomingPost = function(body) {
    var incomingPost = require('./webhook.json');
    var prodBlogId = body.data._items[0].blog_id;

    this.auth = body.data._items[0].blog_token;

    incomingPost.producer_post.blog = prodBlogId;

    return this.request({ 
        path: 'syndication/webhook', 
        method: 'POST',
        data: incomingPost
    });
};

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
        if (res.err) {
            console.log('ERR', res);
            throw(res.err);
        }
        else
            return JSON.parse(res.data);
    })
};

Webhook.prototype.fire = function(currentUrl) {
    return this.login()
        .then((body) => {
            this.auth = 'Basic ' + new Buffer(body.data.token + ':').toString('base64');
            return this.getSyndication();
        })
        .then(this.incomingPost);
};

module.exports = Webhook;
