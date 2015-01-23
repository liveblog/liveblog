'use strict';
var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;

function randomString(maxLen) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < maxLen; i ++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

describe('timeline add to top and edit', function() {
    beforeEach(openUrl('/#/liveblog'));
    it('can add item to top of the timeline', function() {
        openBlog(0);
        var randomText = randomString(10);
        //type the random text
        element(by.css('[class="st-required st-text-block"]')).sendKeys(randomText);
        //click the publish button
        element(by.css('[ng-click="publish()"]')).click();
        browser.waitForAngular();

        //go and check the timeline
        element.all(by.repeater('post in posts')).then(function(posts) {
            var textElement = posts[0].element(by.css('span[medium-editable]'));
            //first element should have the new entered value
            textElement.getText().then(function(text) {
                expect(text).toEqual(randomText);
            });
        });
    });
});
