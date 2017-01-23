var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('timeline pagination', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    it('can scroll to last item and load more', function() {
        var blog = blogs.openBlog(1);
        var postsNo = blog.timeline.all().count(),
            lastPost = blog.timeline.all().last();
        browser.driver.executeScript('arguments[0].scrollIntoView(true);', lastPost.getWebElement());
        browser.waitForAngular();
        expect(blog.timeline.all().count()).toBeGreaterThan(postsNo);
    });
});
