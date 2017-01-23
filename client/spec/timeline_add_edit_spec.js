var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('timeline add to top and edit', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    it('can\'t add blank item in timeline', function() {
        var blog = blogs.openBlog(0);
        blog.editor.getPublishStatus(' ').then(function(value) {
            expect(value).toBe(false);
        });
    });

    it('can add item to top of the timeline', function() {
        var blog = blogs.openBlog(0),
            text = blog.editor.publishText();
        blog.timeline.expectPost(0, {text: text});
    });

    it('can edit an item on the timeline', function() {
        var blog = blogs.openBlog(3);
        blog.timeline.edit(0);
        var newText = blog.editor.publishText();
        browser.waitForAngular();
        blog.timeline.getText(0).then(function (oldText) {
            // wait a change in the post
            browser.wait(function() {
                return blog.timeline.getText(0) !== oldText;
            });
            expect(oldText).toBe(newText);
        });
        blog.timeline.getUpdated(0).then(function(text) {
            expect(text.length).toBeGreaterThan(0);
        });
    });

    it('can unpublish your own post', function() {
        var blog = blogs.openBlog(3);
        blog.editor.publishText();
        blog.editor.publishText();
        blog.openContributions();
        blog.timeline.getFull(0).then(function(text) {
            // unpublish the first post of the timeline and
            // check if it appears on the top of the draft posts list
            blog.timeline.unpublish(0);
            expect(blog.timeline.getFull(0)).not.toBe(text);
            expect(blog.contributions.getFull(0)).toBe(text);
        });
        // twice to ensure the order
        blog.timeline.getFull(0).then(function(text) {
            // unpublish the first post of the timeline and
            // check if it appears on the top of the draft posts list
            blog.timeline.unpublish(0);
            expect(blog.timeline.getFull(0)).not.toBe(text);
            expect(blog.contributions.getFull(0)).toBe(text);
        });
    });
    it('can highlight a post', function() {
        var blog = blogs.openBlog(1);
        blog.editor.publishText();
        blog.timeline.getFull(0).then(function() {
            blog.timeline.highlight(0);
            expect(blog.timeline.get(0).isPresent()).toBe(true);
            blog.timeline.highlight(0);
            expect(blog.timeline.get(0).isPresent()).toBe(true);
        });
    });

    it('can pin a post', function() {
        var blog = blogs.openBlog(3);
        //no pinnned items
        expect(blog.timeline.isPinDrawerVisible()).toBeFalsy();
        //pin post
        blog.timeline.togglePin(0);
        //the pinned drawer should be visible
        expect(blog.timeline.isPinDrawerVisible()).toBeTruthy();
    });
});
