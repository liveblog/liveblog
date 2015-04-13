'use strict';
var openUrl = require('./helpers/utils').open,
    openBlog = require('./helpers/utils').openBlog;

describe('timeline deletions', function() {
    beforeEach(openUrl('/#/liveblog'));
    it('can delete items on the timeline', function() {
        openBlog(2);
        element.all(by.repeater('post in posts')).then(function(posts) {
            //this post should be single item post
            posts[0].getText().then(function(txt) {
                posts[0].element(by.css('.timeline-simple-item')).click();
                posts[0].element(by.css('[ng-click="askRemoveItem(item, post)"]')).click();
                confirmRemoval();
                compareTexts(txt, 0);
            });
        });
    });
    it('can delete posts on the timeline', function() {
        openBlog(2);
        element.all(by.repeater('post in posts')).then(function(posts) {
            //this post should be a multiple item one
            posts[1].getText().then(function(txt) {
                posts[1].element(by.css('.post-item__header')).click();
                posts[1].element(by.css('[dropdown-toggle]')).click();
                posts[1].element(by.css('[ng-click="askRemovePost(post)"]')).click();
                confirmRemoval();
                compareTexts(txt, 1);
            });
        });
    });
});
function compareTexts(oldText, position) {
    element.all(by.repeater('post in posts')).then(function(newPosts) {
        expect(oldText).not.toEqual(newPosts[position].getText());
    });
}

function confirmRemoval() {
    browser.wait(element(by.css('[ng-click="ok()"')).isDisplayed);
    element(by.css('[ng-click="ok()"')).click();
}
