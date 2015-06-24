var utils = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js'),
    login = utils.login,
    expectBlog = require('./helpers/utils.js').expectBlog,
    expectBlogsLength = require('./helpers/utils.js').expectBlogsLength,
    openBlog = require('./helpers/utils').openBlog,
    blogs = require('./helpers/utils.js').blogs;

describe('blogs', function() {
    'use strict';
    var archived = [
        {title: 'title: end to end closed', description: 'description: end to end closed', username: 'first name last name'}
    ], searchs = [
        {blogs: [0, 1, 2], search: 'title'},
        {blogs: [0], search: 'thre'},
        {blogs: [0, 1, 2], search: 'to'}
    ], newBlog = {
        title: 'new blog title',
        description: 'new blog description',
        username: 'first name last name'
    }, newBlogImage = {
        title: 'new blog title',
        description: 'new blog description',
        username: 'first name last name',
        picture_url: './upload/-busstop-jpg-1600-900.jpg'
    };

    beforeEach(function(done) {login().then(done);});

    describe('blogs list:', function() {

        it('can list blogs', function() {
            var blogsLength = blogs.length;
            expectBlogsLength(blogsLength);
            for (var i = 0; i < blogsLength; i++) {
                expectBlog(blogs[i], i);
            }
        });
        it('can list blogs in a listed view', function() {
            // assert we have no <table> as inital state. We should arrive on the grid view.
            expect(element(by.css('.list-container table')).isPresent()).toBe(false);
            // click on the "switch to listed view" button
            element(by.css('button[ng-show="gridview"]')).click();
            // assert we have a listed view (we look for a <table>)
            expect(element(by.css('.list-container table')).isPresent()).toBe(true);
            // check the number of blogs
            expectBlogsLength(blogs.length);
        });
        function searchBlogs(search) {
            element(by.css('[ng-click="flags.extended = !flags.extended"]')).click();
            element(by.model('q')).clear().sendKeys(search.search);
            var currentUrl;
            browser.getCurrentUrl().then(function(url) {
                currentUrl = url;
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
            function checkIfBlogsAreArchived() {
                var blogsLength = archived.length;
                expectBlogsLength(blogsLength);
                for (var i = 0; i < blogsLength; i++) {
                    expectBlog(archived[i], i);
                }
            }
            element(by.repeater('state in states').row(1).column('state.text')).click();
            checkIfBlogsAreArchived();
            browser.get('/#/liveblog/archived');
            checkIfBlogsAreArchived();
        });
    });

    describe('add blog', function() {
        it('should add a blog', function() {
            element(by.css('[ng-click="openNewBlog();"]')).click();
            //after the add new blog model is displayed
            browser.wait(element(by.model('newBlog.title')).isDisplayed);
            element(by.model('newBlog.title')).sendKeys(newBlog.title);
            element(by.model('newBlog.description')).sendKeys(newBlog.description);
            element(by.buttonText('NEXT')).click();
            element(by.buttonText('CREATE')).click();
            expectBlog(newBlog);
        });
        it('should add blog with a image', function() {
            var path = require('path');
            element(by.css('[ng-click="openNewBlog();"]')).click();
            //after the add new blog model is displayed
            browser.wait(element(by.model('newBlog.title')).isDisplayed);
            element(by.model('newBlog.title')).sendKeys(newBlogImage.title);
            element(by.model('newBlog.description')).sendKeys(newBlogImage.description);
            element(by.css('input[type="file"]')).sendKeys(path.resolve(__dirname, newBlogImage.picture_url));
            element(by.buttonText('NEXT')).click();
            element(by.buttonText('CREATE')).click();
            expectBlog(newBlogImage);
        });
        it('should add a blog with members', function() {
            element(by.css('[ng-click="openNewBlog();"]')).click();
            //after the add new blog model is displayed
            browser.wait(element(by.model('newBlog.title')).isDisplayed);
            element(by.model('newBlog.title')).sendKeys(newBlog.title);
            element(by.model('newBlog.description')).sendKeys(newBlog.description);
            element(by.buttonText('NEXT')).click();
            element(by.model('search')).sendKeys('s');
            browser.wait(function() {
                return browser.driver.isElementPresent(by.css('[ng-click="choose(user)"]'));
            }, 5000);
            element(by.repeater('user in users._items').row(0)).click();
            element(by.buttonText('CREATE')).click();
            openBlog(0);
            element(by.css('.settings-link')).click();
            element(by.css('[data="blog-settings-team"]')).click();
            expect(element.all(by.repeater('member in settings.members')).count()).toBe(1);
        });
    });

});
