'use strict';

//var querystring = require('querystring');
var http = require('http');
//var webhookJson = require('./webhook.json');

var Webhook = function(params) {
    this.serverUrl = params.baseBackendUrl;
    this.webhookUrl = this.serverUrl + 'syndication/webhook';
    this.host = params.baseBackendUrl.match(/^http:\/\/([^/:]+)/i)[1];
    this.port = params.baseBackendUrl.match(/:(\d{4})/i)[1];
    this.username = params.username;
    this.password = params.password;

    this.request = this.request.bind(this);
    this.login = this.login.bind(this);
    this.fire = this.fire.bind(this);
};

Webhook.prototype.login = function() {
    return this.request({ 
        path: '/api/auth', 
        method: 'POST',
        data: {
            username: this.username,
            password: this.password
        }
    });
};

Webhook.prototype.request = function(params) {
    var postData;

    var options = {
        host: this.host,
        port: this.port,
        path: params.path,
        method: (params.hasOwnProperty('method')) ? params.method : 'GET',
        headers: {
            'Content-Type': 'application/json;charset=UTF-8'
            //'Accept': 'application/json, text/plain, */*'
            //'Accept-Encoding': 'gzip, deflate',
            //'Accept-Language': 'en-US,en;q=0.8',
            //'Host': 'undefined.local:5000',
            //'Origin': 'http://localhost:9000',
            //'Referer': 'http://localhost:9000/'
        }
    };

    if (options.method === 'POST') {
        postData = JSON.stringify(params.data);
        //options.headers['Content-Length'] = Buffer.byteLength(postData);
        //console.log('post', postData);
    }

    console.log('options', options);

    return new Promise(function(resolve, reject) {
        var req = http.request(options, function(response) {
            //console.log('perform query', response);
            var bodyString = '';
            response.setEncoding('utf8');

            response.on('data', function(chunk) {
                console.log('receiving data...');
                bodyString += chunk;
            });

            response.on('end', function() {
                console.log('end', bodyString);
                resolve(bodyString);
            });
        });

        console.log('promise');

        req.on('error', function(err) {
            console.log('ERR', err);
            reject(err);
        });

        req.on('timeout', function() {
            console.log('timeout');
        });

        if (options.method === 'POST') {
            //req.write(postData);
            console.log('post', postData);
            req.write(postData);
        }

        req.end();
    });
};

Webhook.prototype.fire = function(currentUrl) {
    //var syndId = currentUrl.match(/syndId=([a-z0-9]{24})/i)[1],
    //    syndicationUrl = this.serverUrl + 'syndication_in/' + syndId;

    //console.log(syndicationUrl);

    return this.login()
        .catch(function(err) {
            console.log('err', err);
        });

    //return this.request(syndicationUrl);
    //return this.request(this.webhookUrl);
};

module.exports = Webhook;
