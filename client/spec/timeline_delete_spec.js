var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('timeline deletions', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    it('can delete posts on the timeline', function() {
        var blog = blogs.openBlog(3);
        blog.timeline.all().then(function(posts) {
            blog.timeline.remove(0)
                            .waitForModal()
                            .okModal();
            blog.timeline.all().then(function(newPosts) {
                expect(posts.length).not.toEqual(newPosts.length);
            });
        });
    });
});
