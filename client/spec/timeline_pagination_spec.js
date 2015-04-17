'use strict';
var openUrl = require('./helpers/utils').open,
    openBlog = require('./helpers/utils').openBlog;
describe('timeline pagination', function() {
    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});
    it('can scroll to last item and load more', function() {
        openBlog(2);
        var postsNo = element.all(by.repeater('post in posts')).count(),
            lastPost = element.all(by.repeater('post in posts')).last();
        browser.driver.executeScript('arguments[0].scrollIntoView(true);', lastPost.getWebElement());
        browser.waitForAngular();
        expect(element.all(by.repeater('post in posts')).count()).toBeGreaterThan(postsNo);
    });
});
