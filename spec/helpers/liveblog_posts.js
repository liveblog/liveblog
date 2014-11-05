'use strict';

var liveblogBackend = require('./liveblog_backend');
var backendRequestAuth = liveblogBackend.backendRequestAuth;

var utils = require('./utils');
var getIdFromHref = utils.getIdFromHref;

exports.postCreate = postCreate;
exports.postEdit = postEdit;
exports.postsReorder = postsReorder;
exports.postPublish = postPublish;
exports.postUnpublish = postUnpublish;
exports.postDelete = postDelete;
exports.postCreateAndPublish = postCreateAndPublish;

function postCreate(args, callback) {
    callback = callback || function() {};
    args = args || {};
    var postContent = args.postContent || 'Test post',
        blogId = args.blogId || protractor.getInstance().params.blogId;
    backendRequestAuth({
        method: 'POST',
        uri: '/my/LiveDesk/Blog/' + blogId + '/Post',
        json: {
            'Meta': {},
            'Content': postContent,
            'Type': 'normal',
            'Creator': '1'
        }
    }, function(e, r, j) {
        callback(e, r, j, getIdFromHref(j.href));
    });
}

function postEdit(args, callback) {
    callback = callback || function() {};
    args = args || {};
    var newContent = args.newContent || 'Test post',
        blogId = args.blogId || protractor.getInstance().params.blogId,
        postId = args.postId;
    backendRequestAuth({
        method: 'PUT',
        uri: '/my/LiveDesk/Blog/' + blogId + '/Post/' + postId,
        json: {
            'Content': newContent
        }
    }, function(e, r, j) {
        callback(e, r, j);
    });
}

function postsReorder(args, callback) {
    callback = callback || function() {};
    args = args || {};
    var blogId = args.blogId || protractor.getInstance().params.blogId,
        postId = args.postId,
        otherPostId = args.otherPostId,
        before = args.before;
    backendRequestAuth({
        method: 'PUT',
        uri: '/my/LiveDesk/Blog/' + blogId + '/Post/' + postId + '/Post/' +
            otherPostId + '/Reorder?before=' + before.toString()
    }, function(e, r, j) {
        callback(e, r, j);
    });
}

function postPublish(args, callback) {
    args = args || {};
    callback = callback || function() {};
    var blogId = args.blogId || protractor.getInstance().params.blogId,
        postId = args.postId;
    backendRequestAuth({
        method: 'POST',
        uri: '/my/LiveDesk/Blog/' + blogId + '/Post/' + postId + '/Publish',
        json: {}
    }, function(e, r, j) {
        callback(e, r, j);
    });
}

function postUnpublish(args, callback) {
    args = args || {};
    callback = callback || function() {};
    var blogId = args.blogId || protractor.getInstance().params.blogId,
        postId = args.postId;
    backendRequestAuth({
        method: 'POST',
        uri: '/my/LiveDesk/Blog/' + blogId + '/Post/' + postId + '/Unpublish',
        json: {}
    }, function(e, r, j) {
        callback(e, r, j);
    });
}

function postDelete(args, callback) {
    args = args || {};
    callback = callback || function() {};
    var postId = args.postId;
    backendRequestAuth({
        method: 'DELETE',
        uri: '/my/Data/Post/' + postId,
        json: {}
    }, function(e, r, j) {
        callback(e, r, j);
    });
}

function postCreateAndPublish(args, callback) {
    callback = callback || function() {};
    postCreate(
        args,
        function(e, r, j, id) {
            postPublish({
                    postId: id
                },
                function(e2, r2, j2) {
                    callback(e2, r2, j2, id);
                }
            );
        }
    );
}
