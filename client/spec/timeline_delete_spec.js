'use strict';
var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('timeline deletions', function() {
    beforeEach(function(done) {login().then(done);});
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
