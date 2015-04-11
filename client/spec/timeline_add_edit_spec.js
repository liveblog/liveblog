'use strict';
var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;
var randomString = require('./helpers/utils').randomString;

describe('timeline add to top and edit', function() {
    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});
    it('can add item to top of the timeline', function() {
        openBlog(0);
        var randomText = randomString(10);
        //type the random text
        element(by.css('[class="st-required st-text-block"]')).sendKeys(randomText);
        //click the publish button
        element(by.css('[ng-click="publish()"]')).click();
        browser.waitForAngular();
        //go and check the timeline
        element(by.css('.column-timeline')).all(by.repeater('post in posts')).then(function(posts) {
            var textElement = posts[0].element(by.css('span[medium-editable]'));
            //first element should have the new entered value
            textElement.getText().then(function(text) {
                expect(text).toEqual(randomText);
            });
        });
    });
    it('can edit an item on the timeline', function() {
        openBlog(2);
        var randomText = randomString(10);
        //go and check the timeline
        element(by.css('.column-timeline')).all(by.repeater('post in posts')).then(function(posts) {
            posts[0].isElementPresent(by.css('.lb-post__expander-holder')).then(function(present) {
                if (present) {
                    posts[0].element(by.css('.lb-post__expander-holder')).click();
                }
            });
            var textElement = posts[0].element(by.css('span[medium-editable]'));
            //add some text
            textElement.sendKeys(randomText);
            //click the save button
            posts[0].element(by.css('[ng-click="updateMedium()"]')).click();

            //get the new edited text
            textElement.getText().then(function(editedText) {
                //click on back to liveblog list
                element(by.css('[class="icon-th-large"]')).click();
                //open first blog
                openBlog(2);
                //go and check the timeline
                element(by.css('.column-timeline')).all(by.repeater('post in posts')).then(function(posts) {
                    posts[0].isElementPresent(by.css('.lb-post__expander-holder')).then(function(present) {
                        if (present) {
                            posts[0].element(by.css('.lb-post__expander-holder')).click();
                        }
                    });
                    var textElement = posts[0].element(by.css('span[medium-editable]'));
                    textElement.getText().then(function(text) {
                        //first element should have the new edited value
                        expect(text).toEqual(editedText);
                    });
                });
            });
        });
    });
});
