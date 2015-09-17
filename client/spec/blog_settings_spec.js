var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    randomString = require('./helpers/pages').randomString,
    blogs = require('./helpers/pages').blogs;

describe('Blog settings', function() {
    'use strict';

    beforeEach(function(done) {login('editor', 'editor').then(done);});

    it('should modify title and description for blog', function() {
        var blog = blogs.cloneBlog(0);
        blog.title = randomString();
        blog.description = randomString();

        blogs.openBlog(0).openSettings();
        blogs.blog.settings.title.clear().sendKeys(blog.title);
        blogs.blog.settings.description.clear().sendKeys(blog.description);
        blogs.blog.settings.done()
                .openList()
            .expectBlog(blog, 0);
    });

    it('should change the image for blog', function() {
        var path = require('path'),
            blog = blogs.cloneBlog(0);
        blog.picture_url = './upload/-o-jpg-1600-900.jpg';

        blogs.openBlog(0).openSettings()
                        .openUploadModal();
        blogs.blog.settings.file.sendKeys(path.resolve(__dirname, blog.picture_url));
        blogs.blog.settings
                    .upload()
                    .done()
                .openList()
            .expectBlog(blog);
    });

    it('should remove the image from blog', function() {
        var blog = blogs.cloneBlog(0);
        delete blog.picture_url;

        blogs.openBlog(0).openSettings()
                        .removeImage()
                        .waitForModal()
                        .okModal()
                        .waitDone()
                        .done()
                .openList()
            .expectBlog(blog);
    });

    it('shows original creator full name and username', function() {
        blogs.openBlog(0).openSettings().openTeam();
        blogs.blog.settings.displayName.getText().then(function(text) {
            expect(text).toEqual('Victor the Editor');
        });
        blogs.blog.settings.userName.getText().then(function(text) {
            expect(text).toEqual('editor');
        });
    });

    it('ads a team member from blog settings', function() {
        blogs.openBlog(0).openSettings().openTeam()
                            .editTeam();
        blogs.blog.settings.team
                            .searchUser('s')
                            .waitChooseUser()
                            .changeToUser();
        blogs.blog.settings.doneTeamEdit()
                            .done()
                        .openSettings().openTeam();

        expect(blogs.blog.settings.contributors.count()).toBe(1);
    });

    it('should archive a blog', function() {
        var blog = blogs.cloneBlog(0);
        blogs.openBlog(0).openSettings()
                            .switchStatus()
                            .done()
                .openList()
            .selectState('archived')
            .expectBlog(blog);
    });

    it('should activate a blog', function() {
        var blog = blogs.cloneBlog(0, 'archived');
        blogs.selectState('archived')
            .openBlog(0).openSettings()
                            .switchStatus()
                            .done()
                .openList()
            .selectState('active')
            .expectBlog(blog);
    });

    it('changes blog ownership and admin can open settings for any blog', function() {
        blogs.openBlog(0).openSettings().openTeam()
                            .changeOwner()
                            .changeToOwner()
                            .selectOwner()
                            .done();
        browser.waitForAngular();
        browser.get('/');
        browser.sleep(2000); // it reloads page
        var blog = blogs.openBlog(0);
        browser.waitForAngular();
        blog.openSettings().openTeam();
        blogs.blog.settings.userName.getText().then(function(text) {
            expect(text).toEqual('test_user');
        });
    });

    it('remove a blog', function() {
        blogs.expectCount(4);
        blogs.openBlog(0).openSettings().removeBlog();
        browser.waitForAngular();
        browser.get('/');
        browser.sleep(2000); // it reloads page
        blogs.expectCount(3);
    });
});
