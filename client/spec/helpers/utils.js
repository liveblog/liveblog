'use strict';

// construct url from uri and base url
exports.constructUrl = function(base, uri) {
    return base.replace(/\/$/, '') + uri;
};

var LoginModal = require('./pages').login;

// authenticate if needed
function login() {
    var modal = new LoginModal();
    return modal.btn.isDisplayed()
        .then(function(needLogin) {
            if (needLogin) {
                return modal.login('admin', 'admin');
            }
        });
}

// wait for login to finish
function wait() {
    return browser.sleep(100)
        .then(function() {
            return browser.waitForAngular();
        });
}

// open url and authenticate
function openUrl(url) {
    return function(done) {
        return browser.get('/')
            .then(login)
            .then(wait)
            .then(function() {
                return browser.get(url);
            })
            .then(done);
    };
}

function openBlog(index) {
    index = index || 0;
    element(by.repeater('blog in blogs._items').row(index).column('blog.title')).click();
}

function randomString(maxLen) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < maxLen; i ++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

exports.login = login;
exports.open = openUrl;
exports.openBlog = openBlog;
exports.randomString = randomString;
