'use strict';
var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
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
    beforeEach(function(done) {login().then(done);});
    it('can show items on the timeline', function() {
        var blog = blogs.openBlog(3);
        expect(blog.timeline.all().count()).toEqual(posts.length);
        for (var i = 0; i < posts.length; i++) {
            blog.timeline.expectPost(i, posts[i][0]);
        }
    });
});
