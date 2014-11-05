/*global describe, beforeEach, expect, it, element, by */

var randomText = require('./helpers/utils.js').UUIDv4;
var gotoUri = require('./helpers/liveblog_frontend').gotoUri;
var uploadFixtures = require('./helpers/liveblog_fixtures').uploadFixtures;
var liveblogBackend = require('./helpers/liveblog_posts.js');
var postCreateAndPublish = liveblogBackend.postCreateAndPublish;
var postEdit = liveblogBackend.postEdit;
var postDelete = liveblogBackend.postDelete;
var postUnpublish = liveblogBackend.postUnpublish;
var postsReorder = liveblogBackend.postsReorder;

// Protractor Params:
var pp = protractor.getInstance().params;

describe('Embed', function() {
    'use strict';

    beforeEach(function(done) {
        uploadFixtures('posts', 0, function(e, r, j) {
            gotoUri('/', function() {
                done();
            });
        });
    });

    it(' is rendered serverside', function() {
        expect(
            element(by.css('div[data-gimme="liveblog-layout"]'))
            .isDisplayed()
        ).toBe(true);
    });

    it(' is updating to show just added post', function() {
        var postContent = randomText();
        postCreateAndPublish({
            postContent: postContent
        });
        browser.wait(
            function() {
                return browser.isElementPresent(
                    by.cssContainingText(
                        'div.liveblog-content p.post-text',
                        postContent
                ));
            },
            pp.maxTimeout,
            'Just added post should appear on page.'
        );
    },
    //it
    pp.maxTimeout);

    it(' is updating to show just edited post', function() {
        var postContent = randomText(),
            newContent = randomText(),
            postId;
        postCreateAndPublish({
            postContent: postContent
        }, function(e, r, j, id) {
            postId = id;
        });
        browser.wait(
            function() {
                return browser.isElementPresent(
                    by.cssContainingText(
                        'div.liveblog-content p.post-text',
                        postContent
                ));
            },
            pp.maxTimeout,
            'Just added post should appear on page.'
        ).then(function() {
            postEdit({
                postId: postId,
                newContent: newContent
            });
            browser.wait(
                function() {
                    return browser.isElementPresent(
                        by.cssContainingText(
                            'div.liveblog-content p.post-text',
                            newContent
                        )
                    );
                },
                pp.maxTimeout,
                'Just edited post should be updated on page.'
            );
        });
    },
    //it
    pp.maxTimeout * 2);

    it(' is updating to show what post was just deleted', function() {
        var postContent = randomText(),
            postId;
        postCreateAndPublish({
            postContent: postContent
        }, function(e, r, j, id) {
            postId = id;
        });
        browser.wait(
            function() {
                return browser.isElementPresent(
                    by.cssContainingText(
                        'div.liveblog-content p.post-text',
                        postContent
                ));
            },
            pp.maxTimeout,
            'Just added post should appear on page.'
        ).then(function() {
            postDelete({
                postId: postId
            });
            browser.wait(
                function() {
                    return element.all(
                        by.cssContainingText(
                            'div.liveblog-content p.post-text',
                            postContent
                        )
                    ).count().then(
                        function(count) {
                            return count === 0;
                        }
                    );
                }, pp.maxTimeout,
                'Just deleted post should disappear from page.'
            );
        });
    },
    //it
    pp.maxTimeout * 2);

    it(' is updating to show what post was just ubpublished', function() {
        var postContent = randomText(),
            postId;
        postCreateAndPublish({
            postContent: postContent
        }, function(e, r, j, id) {
            postId = id;
        });
        browser.wait(
            function() {
                return browser.isElementPresent(
                    by.cssContainingText(
                        'div.liveblog-content p.post-text',
                        postContent
                ));
            },
            pp.maxTimeout,
            'Just added post should appear on page.'
        ).then(function() {
            postUnpublish({
                postId: postId
            });
            browser.wait(
                function() {
                    return element.all(
                        by.cssContainingText(
                            'div.liveblog-content p.post-text',
                            postContent
                        )
                    ).count().then(
                        function(count) {
                            return count === 0;
                        }
                    );
                }, pp.maxTimeout,
                'Just unpublished post should disappear from page.'
            );
        });
    },
    //it
    pp.maxTimeout * 2);

    it(' is updating to show what posts were reordered', function() {
        var firstPostContent = randomText(),
            secondPostContent = randomText(),
            firstPostId,
            secondPostId;
        postCreateAndPublish({
            postContent: firstPostContent
        }, function(e, r, j, id) {
            firstPostId = id;
        });
        browser.wait(
            function() {
                return browser.isElementPresent(
                    by.cssContainingText(
                        'div.liveblog-content p.post-text',
                        firstPostContent
                ));
            },
            pp.maxTimeout,
            'First added post should appear on page.'
        ).then(function() {
            postCreateAndPublish({
                postContent: secondPostContent
            }, function(e, r, j, id) {
                secondPostId = id;
            });
            browser.wait(
                function() {
                    return browser.isElementPresent(
                        by.cssContainingText(
                            'div.liveblog-content p.post-text',
                            secondPostContent
                    ));
                },
                pp.maxTimeout,
                'Second added post should appear on page.'
            ).then(function() {
                postsReorder({
                    postId: firstPostId,
                    otherPostId: secondPostId,
                    before: true
                });
                browser.wait(
                    function() {
                        var posts = element.all(
                            by.css('div.liveblog-content p.post-text')
                        );
                        return posts.get(0).getText().then(function(text) {
                            if (text === firstPostContent) {
                                return posts.get(1).getText().then(function (text) {
                                    if (text === secondPostContent) {
                                        return true;
                                    }
                                });
                            }
                        });
                    }, pp.maxTimeout,
                    'Just reordered posts should update on embed.'
                );
            });
        });
    },
    //it
    pp.maxTimeout * 3);

//describe Embed
});
