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
                .openList().then(function() {
                    blogs.expectBlog(blog, 0);
                });
    });

    it('should change the image for blog', function() {
        var path = require('path'),
            blog = blogs.cloneBlog(0);
        blog.picture_url = './upload/-o-jpg-1600-900.jpg';
        blogs.openBlog(0).openSettings().then(function(settingsPage) {
            return settingsPage.openUploadModal();
        })
        .then(function() {
            blogs.blog.settings.file.sendKeys(path.resolve(__dirname, blog.picture_url));
            blogs.blog.settings
                        .upload()
                        .done()
                    .openList().then(function() {
                        blogs.expectBlog(blog);
                    });
        });

    });

    it('should remove the image from blog', function() {
        var blog = blogs.cloneBlog(0);
        delete blog.picture_url;

        blogs.openBlog(0).openSettings().then(function(settingsPage) {
            return settingsPage.removeImage()
            .waitForModal()
            .okModal()
            .waitDone()
            .done()
            .openList().then(function() {
                blogs.expectBlog(blog);
            });
        });
    });

    it('shows original creator full name and username', function() {
        blogs.openBlog(0).openSettings().then(function(settingsPage) {
            return settingsPage.openTeam();
        })
        .then(function() {
            blogs.blog.settings.displayName.getText().then(function(text) {
                expect(text).toEqual('Victor the Editor');
            });
            blogs.blog.settings.userName.getText().then(function(text) {
                expect(text).toEqual('editor');
            });
        });
    });

    it('ads a team member from blog settings', function() {
        blogs
        .openBlog(0)
        .openSettings()
        .then(function(settingsPage) {
            return settingsPage
            .openTeam()
            .then(settingsPage.editTeam);
        })
        .then(function() {
            blogs.blog.settings.team
            .searchUser('s')
            .waitChooseUser()
            .changeToUser();
            blogs.blog.settings
            .doneTeamEdit()
            .done()
            .openSettings().then(function(settingsPage) {
                return settingsPage.openTeam();
            })
            .then(function() {
                expect(blogs.blog.settings.contributors.count()).toBe(1);
            });
        });
    });

    it('should archive a blog', function() {
        var blog = blogs.cloneBlog(0);
        blogs.openBlog(0).openSettings().then(function(settingsPage) {
            settingsPage
            .switchStatus()
            .done()
            .openList()
            .then(function() {
                blogs.selectState('archived')
                .expectBlog(blog);
            });
        });
    });

    it('should activate a blog', function() {
        var blog = blogs.cloneBlog(0, 'archived');
        blogs.selectState('archived')
            .openBlog(0).openSettings().then(function(settingsPage) {
                settingsPage.switchStatus()
                .done()
                .openList()
                .then(function() {
                    blogs.selectState('active')
                    .expectBlog(blog);
                });
            });
    });

    it('changes blog ownership & admin can open settings for any blog & contributor can\'t access blog settings even if owner',
        function() {
        blogs.openBlog(0).openSettings().then(function(settingsPage) {
            return settingsPage.openTeam().then(function() {
                settingsPage.changeOwner()
                .changeToOwner()
                .selectOwner()
                .done();
            });
        })
        .then(function() {
            browser.waitForAngular();
            browser.get('/');
            browser.sleep(2000); // it reloads page
            var blog = blogs.openBlog(0);
            browser.waitForAngular();
            blog.openSettings().then(function(settingsPage) {
                return settingsPage.openTeam()
                .then(function() {
                    blogs.blog.settings.userName.getText().then(function(text) {
                        expect(text).toEqual('contributor');
                    });
                });
            })
            .then(function() {
                browser.get('/');
                element(by.css('button.current-user')).click();
                browser.waitForAngular();
                browser.sleep(1000); // it reloads page
                element(by.buttonText('SIGN OUT')).click();
                browser.sleep(2000); // it reloads page
                browser.waitForAngular();
                browser.sleep(2000); // it reloads page
                login('contributor', 'contributor').then(function() {
                    browser.waitForAngular();
                    expect(element(by.css('.settings-link')).isPresent()).toBeFalsy();
                });
            });
        });
    });

    it('remove a blog', function() {
        blogs.expectCount(4);
        blogs.openBlog(0).openSettings().then(function(settingsPage) {
            settingsPage.removeBlog();
            browser.waitForAngular();
            browser.get('/');
            browser.sleep(2000); // it reloads page
            blogs.expectCount(3);
        });
    });
});
