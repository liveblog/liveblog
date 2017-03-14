var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

var comment = {
    username: 'comment: first last',
    item_type: 'comment',
    text: 'comment: contents'
};

describe('Comments Posts', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login('editor', 'editor')
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    it('can open comments panel from url', function() {
        var comments = blogs.openBlog(0).comments;
        browser.getCurrentUrl().then(function(url) {
            browser.get(url.split('?')[0] + '?panel=comments').then(function() {
                expect(comments.column.isPresent()).toBe(true);
            });
        });
    });

    it('can publish it', function() {
        var comments = blogs.openBlog(0).openComments();
        comments.publish(comments.get(0));
        expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
        expect(comments.all().count()).toBe(0);
    });

    it('can open a comment in the editor and publish it', function() {
        var blog = blogs.openBlog(0),
            comments = blog.openComments();
        comments.edit(comments.get(0));
        var editor = blog.openEditor();
        expect(editor.textElement.getText()).toEqual(comment.text);
        editor.publish().then(function() {
            expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
            blog.openComments();
            expect(comments.all().count()).toBe(0);
        });
    });
});
