var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    logout = require('./helpers/utils').logout,
    waitAndClick = require('./helpers/utils').waitAndClick,
    blogs = require('./helpers/pages').blogs;

describe('Blogs list', function() {
    'use strict';
    var searchs = [
        {blogs: [0, 1, 2, 3], search: 'title'},
        {blogs: [1], search: 'thre'},
        {blogs: [0, 1, 2, 3], search: 'to'}
    ], newBlog = {
        title: 'new blog title',
        description: 'new blog description',
        username: 'Edwin the admin'
    }, 
    newBlogImage = {
        title: 'new blog title',
        description: 'new blog description',
        username: 'Edwin the admin',
        picture_url: './upload/-busstop-jpg-1600-900.jpg'
    };

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    describe('list', function() {

        it('can list blogs', function() {
            var activeBlogs = blogs.getActiveBlogs(),
                count = activeBlogs.length;
            blogs.expectCount(count);
            for (var i = 0; i < count; i++) {
                blogs.expectBlog(activeBlogs[i], i);
            }
        });

        it('can list blogs in a listed view', function() {
            var activeBlogs = blogs.getActiveBlogs(),
                count = activeBlogs.length;
            // assert we have no <table> as inital state. We should arrive on the grid view.
            expect(blogs.gridElement.isPresent()).toBe(false);
            // click on the "switch to listed view" button
            blogs.switchView();
            // assert we have a listed view (we look for a <table>)
            expect(blogs.gridElement.isPresent()).toBe(true);
            // check the number of blogs
            blogs.expectCount(count);
        });

        it('can search all blogs', function() {
            blogs.searchBlogs(searchs[0]);
        });
        it('can search just one blog', function() {
            blogs.searchBlogs(searchs[1]);
        });

        it('can search case insensitive blogs', function() {
            blogs.searchBlogs(searchs[2]);
        });

        it('can list archived blogs', function() {
            var archivedBlogs = blogs.getArchivedBlogs(),
                count = archivedBlogs.length;
            blogs.selectState('archived');
            browser.getCurrentUrl().then(function(url) {
                expect(url.indexOf('archived')).toBeGreaterThan(-1);
            });
            blogs.expectCount(count);
            for (var i = 0; i < count; i++) {
                blogs.expectBlog(archivedBlogs[i], i);
            }
        });

        it('can request access to a blog by a non member', function() {
            logout();
            browser.ignoreSynchronization = true;

            login('contributor', 'contributor').then(function() {
                browser.ignoreSynchronization = false;
                //request for blog dialog opens instead of the the blog
                blogs.openBlog(1);
                browser.wait(function() {
                    return element(by.css('button[ng-click="requestAccess(accessRequestedTo)"]')).isDisplayed();
                });
                element(by.css('button[ng-click="requestAccess(accessRequestedTo)"]')).click();
                logout();
                browser.ignoreSynchronization = true;

                login('admin', 'admin').then(function() {
                    browser.ignoreSynchronization = false;
                    blogs.openBlog(1).openSettings().then(function(settingsPage) {
                        return settingsPage.openTeam();
                    })
                    .then(function() {
                        return waitAndClick(by.css('.pending-blog-member'));
                    })
                    .then(function() {
                        return waitAndClick(by.css('[data-button="ACCEPT-NEW-MEMBER"]'));
                    })
                    .then(function() {
                        browser.waitForAngular();
                        expect(blogs.blog.settings.contributors.count()).toBe(1);
                    });
                });
            });
        });
    });

    describe('add', function() {

        it('should add a blog', function() {
            blogs.openCreateBlog().waitForModal();
            blogs.title.sendKeys(newBlog.title);
            blogs.description.sendKeys(newBlog.description);
            blogs.createBlogNext().createBlogCreate().openList()
            .then(function() {
                blogs.expectBlog(newBlog);
            });
        });

        it('should add blog with a image', function() {
            var path = require('path');
            blogs.openCreateBlog().waitForModal();
            blogs.title.sendKeys(newBlog.title);
            blogs.description.sendKeys(newBlog.description);
            blogs.file.sendKeys(path.resolve(__dirname, newBlogImage.picture_url));
            blogs.createBlogNext().createBlogCreate().openList()
            .then(function() {
                blogs.expectBlog(newBlogImage);
            });
        });

        it('should add a blog with members', function() {
            blogs.openCreateBlog().waitForModal();

            blogs.title.sendKeys(newBlog.title);
            blogs.description.sendKeys(newBlog.description);
            blogs.createBlogNext();
            blogs.team.searchUser('s')
                    .waitChooseUser()
                    .changeToUser();
            blogs.createBlogCreate().openSettings().then(function(settingsPage) {
                return settingsPage.openTeam();
            })
            .then(function() {
                expect(blogs.blog.settings.contributors.count()).toBe(1);
            });
        });
    });

});
