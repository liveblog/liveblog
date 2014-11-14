var Login = require('./helpers/pages').login;

describe('blogs', function() {
    'use strict';
    var waitTime = 2 * 1000;
    var blogs = [
            {title: 'title: end to end One', description: 'description: end to end one', username: 'admin'},
            {title: 'title: end to end two', description: 'description: end to end two', username: 'admin'},
            {title: 'title: end To end three', description: 'description: end to end three', username: 'admin'}
    ], archived = [
            {title: 'title: end to end closed', description: 'description: end to end closed', username: 'admin'}
    ], searchs = [
            {blogs: [0, 1, 2], search: 'title'},
            {blogs: [0], search: 'One'},
            {blogs: [0, 1, 2], search: 'to'}
    ];
    beforeEach(function() {
        (new Login()).login();
    });

    describe('blogs list:', function() {
        beforeEach(function() {
            element.all(by.css('[href="#/liveblog"]')).get(0).click();
        });
        it('can list blogs', function() {
                var blogsLength = blogs.length;
                expectBlogsLength(blogsLength);
                for (var i = 0; i < blogsLength; i++) {
                    expectBlog(blogs[i], i);
                }
        });
        it('can search blogs', function() {
            element(by.css('[ng-click="flags.open = !flags.open"]')).click();
            function checkSearch() {
                expectBlogsLength(search.blogs.length);
                for (var j = 0, countj = search.blogs.length; j < countj; j++) {
                    expectBlog(blogs[search.blogs[j]], j);
                }
            }
            for (var i = 0, counti = searchs.length, search; i < counti; i++) {
                search = searchs[i];
                element(by.model('search')).sendKeys(search.search);
                browser.wait(checkSearch, waitTime, 'correct search result didn\'t appeared in 2 seconds');
            }
        });
        it('can list archived blogs', function() {
            element(by.binding('activeState.text')).click();
            element(by.repeater('state in states').row(1).column('state.text')).click();
            var blogsLength = archived.length;
                expectBlogsLength(blogsLength);
                for (var i = 0; i < blogsLength; i++) {
                    expectBlog(archived[i], i);
                }
            });

    });
    function expectBlogsLength(len) {
         element.all(by.repeater('blog in blogs._items')).then(function(blogs) {
            expect(blogs.length).toBe(len);
        });
    }
    function expectBlog(info, index) {
        index = index || 0;
        expect(element(by.repeater('blog in blogs._items').row(index).column('blog.title')).getText()).toBe(info.title);
        expect(element(by.repeater('blog in blogs._items').row(index).column('blog.description')).getText()).toBe(info.description);
        expect(element(
            by.repeater('blog in blogs._items')
                .row(index)
                .column('blog.original_creator | username'))
                .getText())
        .toBe(info.username);
    }
});
