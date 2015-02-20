'use strict';
var openUrl = require('./helpers/utils').open,
    openBlog = require('./helpers/utils').openBlog;

describe('timeline', function() {
    beforeEach(openUrl('/#/liveblog'));
    it('can delete items on the timeline', function() {
        openBlog(0);
        element.all(by.repeater('post in posts')).then(function(posts) {
            //this post should be single item post
            removeItems(posts[2], posts.length);
            //expand multiple item post
            posts[1].element(by.css('[expand-post]')).click();
            removeItems(posts[1], (posts.length - 1));
        });
    });

    function removeItems(myPost, iLen) {
        var items = myPost.all(by.repeater('item in post.items'));
        items.count().then(function(myLen) {
            for (var i = (myLen - 1), item; i >= 0; i --) {
                item = items.get(i);
                item.element(by.css('.timeline-simple-item')).click();
                //click on options button
                item.element(by.css('[dropdown-toggle]')).click();
                //click on remove item link
                item.element(by.css('[ng-click="removeItem(item, $index);"]')).click();
                //confirm remove item
                browser.wait(element(by.css('[ng-click="ok()"')).isDisplayed);
                element(by.css('[ng-click="ok()"')).click();
                browser.waitForAngular();
            }
        });
        expect(element.all(by.repeater('post in posts')).count()).toEqual(iLen - 1);
    }
});
