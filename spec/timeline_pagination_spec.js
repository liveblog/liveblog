'use strict';
var openUrl = require('./helpers/utils').open,
    openBlog = require('./helpers/utils').openBlog;
describe('timeline', function() {
    beforeEach(openUrl('/#/liveblog'));
    it('can delete scroll to last item and load more', function() {
        openBlog(0);
        var postsNo = element.all(by.repeater('post in posts')).count(),
            lastPost = element.all(by.repeater('post in posts')).last();
        browser.driver.executeScript('arguments[0].scrollIntoView(true);', lastPost.getWebElement());
        browser.waitForAngular();
        expect(by.repeater('post in posts')).toBeGreaterThan(postsNo);
    });
});
