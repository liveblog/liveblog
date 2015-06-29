'use strict';
var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    openBlog = require('./helpers/utils.js').openBlog;

describe('timeline deletions', function() {
    beforeEach(function(done) {login().then(done);});
    it('can delete posts on the timeline', function() {
        openBlog(3);
        element.all(by.repeater('post in posts')).then(function(posts) {
            posts[0].element(by.css('[ng-click="askRemovePost(post)"]')).click();
            confirmRemoval();
            compare(posts.length);
        });
    });
});
function compare(oldLength) {
    element.all(by.repeater('post in posts')).then(function(newPosts) {
        expect(oldLength).not.toEqual(newPosts.length);
    });
}
function confirmRemoval() {
    browser.wait(function() {
        return element(by.css('.modal-footer.ng-scope')).isDisplayed();
    });
    element(by.css('button[ng-click="ok()"')).sendKeys(protractor.Key.ENTER);
}
