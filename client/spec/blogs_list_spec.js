var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    list = require('./helpers/pages').list;

describe('Blogs list', function() {
    'use strict';
    var searchs = [
        {blogs: [0, 1, 2, 3], search: 'title'},
        {blogs: [1], search: 'thre'},
        {blogs: [0, 1, 2, 3], search: 'to'}
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

    describe('list', function() {

        it('can list blogs', function() {
            var blogs = list.getActiveBlogs(),
                count = blogs.length;
            list.expectCount(count);
            for (var i = 0; i < count; i++) {
                list.expectBlog(blogs[i], i);
            }
        });

        it('can list blogs in a listed view', function() {
            var blogs = list.getActiveBlogs(),
                count = blogs.length;
            // assert we have no <table> as inital state. We should arrive on the grid view.
            expect(list.gridElement.isPresent()).toBe(false);
            // click on the "switch to listed view" button
            list.switchView();
            // assert we have a listed view (we look for a <table>)
            expect(list.gridElement.isPresent()).toBe(true);
            // check the number of blogs
            list.expectCount(count);
        });

        it('can search all blogs', function() {
            list.searchBlogs(searchs[0]);
        });
        it('can search just one blog', function() {
            list.searchBlogs(searchs[1]);
        });
        it('can search case insensitive blogs', function() {
            list.searchBlogs(searchs[2]);
            var blogs = list.getActiveBlogs(),
                count = blogs.length;
        });

        it('can list archived blogs', function() {
            var blogs = list.getArchivedBlogs(),
                count = blogs.length;
            list.selectState('archived');
            browser.getCurrentUrl().then(function(url) {
                expect(url.indexOf('archived')).toBeGreaterThan(-1);
            });
            list.expectCount(count);
            for (var i = 0; i < count; i++) {
                list.expectBlog(blogs[i], i);
            }
        });
    });

    describe('add', function() {

        it('should add a blog', function() {
            list.openCreateBlog().waitForModal();

            list.title.sendKeys(newBlog.title);
            list.description.sendKeys(newBlog.description);
            list.createBlogNext().createBlogCreate()
                    .openList()
                .expectBlog(newBlog);
        });

        it('should add blog with a image', function() {
            var path = require('path');
            list.openCreateBlog().waitForModal();
            list.title.sendKeys(newBlog.title);
            list.description.sendKeys(newBlog.description);
            list.file.sendKeys(path.resolve(__dirname, newBlogImage.picture_url));
            list.createBlogNext().createBlogCreate()
                    .openList()
                .expectBlog(newBlogImage);
        });

        it('should add a blog with members', function() {
            list.openCreateBlog().waitForModal();

            list.title.sendKeys(newBlog.title);
            list.description.sendKeys(newBlog.description);
            list.createBlogNext();
            list.team.searchUser('s')
                    .waitChooseUser()
                    .changeToUser();
            list.createBlogCreate().openSettings().openTeam();
            expect(list.blog.settings.contributors.count()).toBe(1);
        });
    });

});
