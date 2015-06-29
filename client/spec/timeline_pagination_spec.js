'use strict';
var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    openBlog = require('./helpers/utils.js').openBlog;
describe('timeline pagination', function() {
    beforeEach(function(done) {login().then(done);});
    it('can scroll to last item and load more', function() {
        openBlog(1);
        var postsNo = element.all(by.repeater('post in posts')).count(),
            lastPost = element.all(by.repeater('post in posts')).last();
        browser.driver.executeScript('arguments[0].scrollIntoView(true);', lastPost.getWebElement());
        browser.waitForAngular();
        expect(element.all(by.repeater('post in posts')).count()).toBeGreaterThan(postsNo);
    });
});
