var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

var comment = {
    username: 'comment: first last',
    item_type: 'comment',
    text: 'comment: contents'
};

describe('Comments Posts', () => {
    beforeEach((done) => {
        login('editor', 'editor')
            .then(done);
    });

    it('can open comments panel from url', () => {
        var comments = blogs.openBlog(0).comments;

        browser.getCurrentUrl().then((url) => {
            browser.get(url.split('?')[0] + '?panel=comments')
                .then(() => {
                    expect(comments.column.isPresent()).toBe(true);
                });
        });
    });

    it('can publish it', () => {
        var comments = blogs.openBlog(0).openComments();

        comments.publish(comments.get(0));
        expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
        expect(comments.all().count()).toBe(0);
    });

    it('can open a comment in the editor and publish it', () => {
        var blog = blogs.openBlog(0),
            comments = blog.openComments();

        comments.edit(comments.get(0));
        var editor = blog.openEditor();

        expect(editor.textElement.getText()).toEqual(comment.text);
        editor.publish().then(() => {
            expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
            blog.openComments();
            expect(comments.all().count()).toBe(0);
        });
    });
});
