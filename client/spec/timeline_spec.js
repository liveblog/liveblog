'use strict';
var posts = [
        [{
            username: 'first name last name',
            item_type: 'text',
            text: 'text post three: end to end item one'
        }],
        [{
            username: 'first name last name',
            item_type: 'text',
            text: 'text post two: end to end item onE'
        },
        {
            username: 'first name last name',
            item_type: 'text',
            text: 'text post two: end to end item two'
        }],
        [{
            username: 'first name last name',
            item_type: 'text',
            text: 'text post one: end to end item One'
        },
        {
            username: 'first name last name',
            item_type: 'text',
            text: 'text post one: end to end item two'
        },
        {
            username: 'first name last name',
            item_type: 'text',
            text: 'text post one: End to End item three'
        }]
    ],
    login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    openBlog = require('./helpers/utils.js').openBlog;

describe('timeline', function() {
    beforeEach(function(done) {login().then(done);});
    it('can show items on the timeline', function() {
        openBlog(3);
        //go and check the timeline
        element.all(by.repeater('post in posts')).then(function(marks) {
            var postsLength = posts.length;
            expectPostLength(postsLength);
            for (var i = 0; i < postsLength; i++) {
                expectPost(posts[i][0], marks[i]);
            }
        });
    });

    it('can reorder posts on the timeline', function() {
        openBlog(3);
        element.all(by.repeater('post in posts')).then(function(timelinePosts) {
            //move 2nd element to 1st postion
            timelinePosts[1].element(by.css('[ng-click="preMovePost(post);"]')).click();
            element.all(by.css('[ng-click="movePost(index, \'above\');"]')).get(0).click();

            element.all(by.repeater('post in posts')).then(function(marks) {
                //expect the 1st post from the timeline to be the 2nd post from the initial array
                expectPost(posts[1][0], marks[0]);
            });
        });
    });

    function expectPost(post, mark) {
        expect(mark.element(by.binding('post.original_creator_name')).getText()).toBe(post.username);
        expect(mark.element(by.css('.lb-post__list')).getText()).toBe(post.text);
    }

    function expectPostLength(len) {
        expect(element.all(by.repeater('post in posts')).count()).toEqual(len);
    }
});
