var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('timeline pagination', function() {
    'use strict';
    beforeEach(function(done) {login().then(done);});
    it('can scroll to last item and load more', function() {
        var blog = blogs.openBlog(1);
        var postsNo = blog.timeline.all().count(),
            lastPost = blog.timeline.all().last();
        browser.driver.executeScript('arguments[0].scrollIntoView(true);', lastPost.getWebElement());
        browser.waitForAngular();
        expect(blog.timeline.all().count()).toBeGreaterThan(postsNo);
    });
});
