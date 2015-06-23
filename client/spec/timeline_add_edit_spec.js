'use strict';
var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login;
var openBlog = require('./helpers/utils.js').openBlog;
var randomString = require('./helpers/utils.js').randomString;

describe('timeline add to top and edit', function() {

    function publishPost() {
        var randomText = randomString(10);
        //type the random text
        element(by.css('[class="st-required st-text-block"]')).sendKeys(randomText);
        //click the publish button
        element(by.css('[ng-click="publish()"]')).click();
        return randomText;
    }

    beforeEach(function(done) {login().then(done);});

    it('can add item to top of the timeline', function() {
        openBlog(0);
        var randomText = publishPost();
        //go and check the timeline
        element(by.css('.column-timeline')).all(by.repeater('post in posts')).then(function(posts) {
            var textElement = posts[0].element(by.css('[lb-bind-html]'));
            //first element should have the new entered value
            textElement.getText().then(function(text) {
                expect(text).toEqual(randomText);
            });
            //updated time should have a non empty value
            var updatedTimeEl = posts[0].element(by.css('.updated-time'));
            updatedTimeEl.getText().then(function(text) {
                expect(text.length).toBeGreaterThan(0);
            });
        });
    });

    it('can edit an item on the timeline', function() {

        function getFirstPostText() {
            return element(by.repeater('post in postsList.posts').row(0))
                .element(by.css('.lb-post__list')).getText();
        }

        var randomText = randomString(10);
        openBlog(2);
        element(by.repeater('post in posts').row(0))
            .element(by.css('[ng-click="onEditClick(post)"]')).click();
        element(by.css('.editor .st-text-block')).clear().sendKeys(randomText);
        element(by.css('[ng-click="publish()"]')).click();
        browser.waitForAngular();
        getFirstPostText().then(function (old_text) {
                // wait a change in the post
                browser.wait(function() {
                    return getFirstPostText() !== old_text;
                });
                expect(getFirstPostText()).toBe(randomText);
            });
    });

    it('can unpublish your own post', function() {

        function getFirstPost(column) {
            return element(by.css('.column-' + column))
                .element(by.repeater('post in posts').row(0));
        }

        // unpublish the first post of the timeline and
        // check if it appears on the top of the draft posts list
        function unpublishAndTest() {
            getFirstPost('timeline')
                .element(by.css('.lb-post__list'))
                .getText().then(function(firstTimelinePostContent) {
                    getFirstPost('timeline')
                        .element(by.css('[ng-click="unpublishPost(post)"]')).click().then(function () {
                            expect(getFirstPost('timeline').element(by.css('.lb-post__list')).getText()).toNotBe(firstTimelinePostContent);
                            expect(getFirstPost('draft-posts').element(by.css('.lb-post__list')).getText()).toBe(firstTimelinePostContent);
                        });
                });
        }

        openBlog(2);
        publishPost();
        publishPost();
        // open draft posts panel
        element(by.css('[ng-click="toggleDraftPanel()"]')).click();
        unpublishAndTest();
        // twice to ensure the order
        unpublishAndTest();
    });
});
