var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

var posts = [
        [{
            username: 'Victor the Editor',
            item_type: 'text',
            text: 'text post three: end to end item one'
        }],
        [{
            username: 'Victor the Editor',
            item_type: 'text',
            text: 'text post two: end to end item onE'
        },
        {
            username: 'Victor the Editor',
            item_type: 'text',
            text: 'text post two: end to end item two'
        }],
        [{
            username: 'Victor the Editor',
            item_type: 'text',
            text: 'text post one: end to end item One'
        },
        {
            username: 'Victor the Editor',
            item_type: 'text',
            text: 'text post one: end to end item two'
        },
        {
            username: 'Victor the Editor',
            item_type: 'text',
            text: 'text post one: End to End item three'
        }]
    ];

describe('timeline', function() {
    'use strict';

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    it('can show items on the timeline', function() {
        var blog = blogs.openBlog(3);
        expect(blog.timeline.all().count()).toEqual(posts.length);
        for (var i = 0; i < posts.length; i++) {
            blog.timeline.expectPost(i, posts[i][0]);
        }
    });
    it('can reorder posts on the timeline', function() {
        var blog = blogs.openBlog(3);
        blog.timeline.startMoving(1);
        blog.timeline.moveTo(0);
        blog.timeline.expectPost(0, posts[1][0]);
    });
    it('can\'t reorder a single post on the timeline', function() {
        var blog = blogs.openBlog(2);
        expect(blog.timeline.canBeMoved(0)).toEqual(false);
    });
});
