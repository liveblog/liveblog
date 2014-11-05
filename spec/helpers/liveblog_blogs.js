'use strict';

var liveblogBackend = require('./liveblog_backend');
var backendRequestAuth = liveblogBackend.backendRequestAuth;

var utils = require('./utils');

exports.blogCreate = blogCreate;

function blogCreate(blogTitle, callback) {
    callback = callback || function() {};
    blogTitle = blogTitle || 'New Blog';
    backendRequestAuth({
        method: 'POST',
        uri: '/my/LiveDesk/Blog',
        json: {
          'Creator': '1',
          'Description': 'New blog description',
          'Language': '3',
          'Title': blogTitle,
          'Type': '1'
        }
    }, function(e, r, j) {
        var id = utils.getIdFromHref(j.href);
        callback(e, r, j, id);
    });
}
