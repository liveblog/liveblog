var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('Draft Posts', function() {
    'use strict';

    beforeEach(function(done) {
        browser.ignoreSynchronization = true;
        login()
            .then(() => browser.ignoreSynchronization = false)
            .then(done);
    });

    it('can open drafts panel from url', function() {
        var drafts = blogs.openBlog(0).drafts;
        browser.getCurrentUrl().then(function(url) {
            browser.get(url.split('?')[0] + '?panel=drafts').then(function() {
                expect(drafts.column.isPresent()).toBe(true);
            });
        });
    });

    it('can create drafts and respect the order', function() {
        var blog = blogs.openBlog(0);
        var dataDraft1 = blog.editor.createDraft();
        var dataDraft = blog.editor.createDraft();
        // check
        blog.openDrafts()
            .expectPost(0, dataDraft.quote)
            .expectPost(1, dataDraft1.quote);
    });

    it('can open a draft in the editor and publish it', function() {
        var blog = blogs.openBlog(0);
        var dataDraft = blog.editor.createDraft();
        var drafts = blog.openDrafts();
        var draft = drafts.get(0);
        drafts.edit(draft);
        var editor = blog.openEditor();
        expect(editor.textElement.getText()).toEqual(dataDraft.body);
        editor.publish().then(function() {
            expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
            blog.openDrafts();
            expect(drafts.all().count()).toBe(0);
        });
    });
});
