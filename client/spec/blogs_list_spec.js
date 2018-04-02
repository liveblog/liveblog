var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    logout = require('./helpers/utils').logout,
    waitAndClick = require('./helpers/utils').waitAndClick,
    blogs = require('./helpers/pages').blogs;

describe('Blogs list', () => {
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

    beforeEach((done) => {
        login()
            .then(done);
    });

    describe('list', () => {
        it('can list blogs', () => {
            var activeBlogs = blogs.getActiveBlogs(),
                count = activeBlogs.length;

            blogs.expectCount(count);
            for (var i = 0; i < count; i++) {
                blogs.expectBlog(activeBlogs[i], i);
            }
        });

        it('can list blogs in a listed view', () => {
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

        it('can search all blogs', () => {
            blogs.searchBlogs(searchs[0]);
        });
        it('can search just one blog', () => {
            blogs.searchBlogs(searchs[1]);
        });

        it('can search case insensitive blogs', () => {
            blogs.searchBlogs(searchs[2]);
        });

        it('can list archived blogs', () => {
            var archivedBlogs = blogs.getArchivedBlogs(),
                count = archivedBlogs.length;

            blogs.selectState('archived');
            browser.getCurrentUrl().then((url) => {
                expect(url.indexOf('archived')).toBeGreaterThan(-1);
            });
            blogs.expectCount(count);
            for (var i = 0; i < count; i++) {
                blogs.expectBlog(archivedBlogs[i], i);
            }
        });

        it('can request access to a blog by a non member', () => {
            logout();

            login('contributor', 'contributor').then(() => {
                // request for blog dialog opens instead of the the blog
                blogs.openBlog(1);
                browser.wait(() => element(by.css('button[ng-click="requestAccess(accessRequestedTo)"]')).isDisplayed());
                element(by.css('button[ng-click="requestAccess(accessRequestedTo)"]')).click();
                logout();


                login('admin', 'admin')
                    .then(() => {

                        blogs.openBlog(1)
                            .openSettings()
                            .then((settingsPage) =>
                                settingsPage.openTeam()
                            )
                            .then(() =>
                                waitAndClick(by.css('.pending-blog-member'))
                            )
                            .then(() =>
                                waitAndClick(by.css('[data-button="ACCEPT-NEW-MEMBER"]'))
                            )
                            .then(() => {
                                browser.waitForAngular();
                                expect(blogs.blog.settings.contributors.count()).toBe(1);
                            });
                    });
            });
        });
    });

    describe('add', () => {
        it('should add a blog', () => {
            blogs.openCreateBlog().waitForModal();
            blogs.title.sendKeys(newBlog.title);
            blogs.description.sendKeys(newBlog.description);
            blogs.createBlogNext()
                .createBlogCreate()
                .openList()
                .then(() => {
                    blogs.expectBlog(newBlog);
                });
        });

        it('should add blog with a image', () => {
            var path = require('path');

            blogs.openCreateBlog().waitForModal();
            blogs.title.sendKeys(newBlog.title);
            blogs.description.sendKeys(newBlog.description);
            blogs.file.sendKeys(path.resolve(__dirname, newBlogImage.picture_url));
            blogs.createBlogNext()
                .createBlogCreate()
                .openList()
                .then(() => {
                    blogs.expectBlog(newBlogImage);
                });
        });

        it('should add a blog with members', () => {
            blogs.openCreateBlog().waitForModal();

            blogs.title.sendKeys(newBlog.title);
            blogs.description.sendKeys(newBlog.description);
            blogs.createBlogNext();
            blogs.team.searchUser('g')
                .waitChooseUser()
                .changeToUser();
            blogs.createBlogCreate()
                .openSettings()
                .then((settingsPage) =>
                    settingsPage.openTeam()
                )
                .then(() => {
                    expect(blogs.blog.settings.contributors.count()).toBe(1);
                });
        });
    });
});
