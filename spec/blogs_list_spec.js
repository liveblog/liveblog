var openUrl = require('./helpers/utils').open;

describe('blogs', function() {
    'use strict';
    var waitTime = 2 * 1000;
    var blogs = [
            {title: 'title: end to end One', description: 'description: end to end one', username: 'first name last name'},
            {title: 'title: end to end two', description: 'description: end to end two', username: 'first name last name'},
            {title: 'title: end To end three', description: 'description: end to end three', username: 'first name last name'}
    ], archived = [
            {title: 'title: end to end closed', description: 'description: end to end closed', username: 'first name last name'}
    ], searchs = [
            {blogs: [0, 1, 2], search: 'title'},
            {blogs: [0], search: 'One'},
            {blogs: [0, 1, 2], search: 'to'}
    ];

    beforeEach(openUrl('/#/liveblog'));

    describe('blogs list:', function() {

        it('can list blogs', function() {
            var blogsLength = blogs.length;
            expectBlogsLength(blogsLength);
            for (var i = 0; i < blogsLength; i++) {
                expectBlog(blogs[i], i);
            }
        });
        function searchBlogs(search) {
            element(by.css('[ng-click="flags.open = !flags.open"]')).click();
            element(by.model('search')).clear().sendKeys(search.search);
            var currentUrl;
            browser.getCurrentUrl().then(function(url) {
                    currentUrl = url;
                }
            ).then(function() {
                    browser.wait(function() {
                        return browser.getCurrentUrl().then(function (url) {
                            return url !== currentUrl;
                        });
                    }, waitTime);
                }
            ).then(function () {
                expectBlogsLength(search.blogs.length);
                for (var j = 0, countj = search.blogs.length; j < countj; j++) {
                    expectBlog(blogs[search.blogs[j]], j);
                }
            });
        }
        it('can search all blogs', function() {
            searchBlogs(searchs[0]);
        });
        it('can search just one blog', function() {
            searchBlogs(searchs[1]);
        });
        it('can search case insensitive blogs', function() {
            searchBlogs(searchs[2]);
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
        expect(element.all(by.repeater('blog in blogs._items')).count()).toEqual(len);
    }
    function expectBlog(blog, index) {
        index = index || 0;
        expect(element(by.repeater('blog in blogs._items').row(index).column('blog.title')).getText()).toBe(blog.title);
        expect(element(by.repeater('blog in blogs._items').row(index).column('blog.description')).getText()).toBe(blog.description);
        expect(element(
            by.repeater('blog in blogs._items')
                .row(index)
                .column('blog.original_creator | username'))
                .getText())
        .toBe(blog.username);
    }
});
