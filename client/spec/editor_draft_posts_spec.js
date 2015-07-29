var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    blogs = require('./helpers/pages').blogs;

describe('Draft Posts', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    it('can open drafts panel from url', function() {
        var drafts = blogs.openBlog(0).drafts;
        browser.getCurrentUrl().then(function(url) {
            browser.get(url + '?drafts=open').then(function() {
                expect(drafts.posts.isPresent()).toBe(true);
            });
        });
    });

    it('can create drafts and respect the order', function() {
        var drafts = blogs.openBlog(0).openDrafts(),
            dataDraft1 = drafts.editor.createDraft(),
            dataDraft  = drafts.editor.createDraft();
        // check
        drafts
            .expectPost(0, dataDraft.quote)
            .expectPost(1, dataDraft1.quote);
    });

    it('can open a draft in the editor and publish it', function() {
        var drafts = blogs.openBlog(0).openDrafts(),
            dataDraft  = drafts.editor.createDraft();
        drafts.editor.resetEditor();
        browser.waitForAngular();
        var draft = drafts.get(0);
        drafts.edit(draft).waitForEditor();
        expect(drafts.editor.textElement.getText()).toEqual(dataDraft.body);
        drafts.editor.publish().then(function() {
            expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
            expect(drafts.all().count()).toBe(0);
        });
    });
});
