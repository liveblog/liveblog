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
    openUrl = require('./helpers/utils').open,
    openBlog = require('./helpers/utils').openBlog;

describe('timeline', function() {
    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});
    it('can get items on the timeline', function() {
        openBlog(0);
        //go and check the timeline
       element.all(by.repeater('post in posts')).then(function(marks) {
            var postsLength = posts.length;
            expectPostLength(postsLength);
            for (var i = 0; i < postsLength; i++) {
                expectPost(posts[i][0], marks[i]);
            }
       });
    });

    function expectPost(post, mark) {
        expect(mark.element(by.css('strong')).getText()).toBe(post.username);
        expect(mark.element(by.css('span[medium-editable]')).getText()).toBe(post.text);
    }

    function expectPostLength(len) {
        expect(element.all(by.repeater('post in posts')).count()).toEqual(len);
    }
});
