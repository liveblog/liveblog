var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    randomString = require('./helpers/pages').randomString,
    blogs = require('./helpers/pages').blogs;

describe('Blog settings', function() {
    'use strict';

    // FIXME: must be uncommented after release (LBSD-546) * must change to support pageObject
    // var DEFAULT_LANGUAGE = 'english';
    // var NEW_LANGUAGE = 'french';

    beforeEach(function(done) {login('editor', 'editor').then(done);});

    // FIXME: must be uncommented after release (LBSD-546) * must change to support pageObject
    // function expectSelectedLanguageIs(language) {
    //     expect(element(by.model('settings.blogPreferences.language')).$('option:checked').getText()).toEqual(language);
    // }

    // function setLanguage(language) {
    //     element(by.model('settings.blogPreferences.language')).sendKeys(language);
    // }

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

    // FIXME: must be uncommented after release (LBSD-546) * must change to support pageObject
    // it('shows the default language selected', function() {
    //     openBlog(0);
    //     openSettings();
    //     expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    // });

    // it('shows the default language selected', function() {
    //     openBlog(0);
    //     openSettings();
    //     expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    // });

    // it('save a new value for language', function() {
    //     openBlog(0);
    //     openSettings();
    //     setLanguage(NEW_LANGUAGE);
    //     // save
    //     element(by.css('[ng-click="settings.saveAndClose()"]')).click();
    //     openSettings();
    //     expectSelectedLanguageIs(NEW_LANGUAGE);
    // });

    // it('reset default language value', function() {
    //     openBlog(0);
    //     openSettings();
    //     setLanguage(NEW_LANGUAGE);
    //     // save a new value
    //     element(by.css('[ng-click="settings.saveAndClose()"]')).click();
    //     openSettings();
    //     expectSelectedLanguageIs(NEW_LANGUAGE);
    //     // reset
    //     element(by.css('[ng-click="settings.reset()"]')).click();
    //     expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    // });

    // it('cancel changed language', function() {
    //     openBlog(0);
    //     openSettings();
    //     setLanguage(NEW_LANGUAGE);
    //     // cancel
    //     element(by.css('[ng-click="settings.close()"]')).click();
    //     browser.wait(function() {
    //         return element(by.css('.modal-footer.ng-scope')).isDisplayed();
    //     });
    //     element(by.css('button[ng-click="ok()"')).sendKeys(protractor.Key.ENTER);
    //     openSettings();
    //     expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    // });
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

    it('changes blog ownership', function() {
        blogs.openBlog(0).openSettings().openTeam()
                            .changeOwner()
                            .changeToOwner()
                            .selectOwner()
                            .done();

        browser.driver.manage().window().setSize(1280, 1024);
        browser.get('/');
        element(by.css('button.current-user')).click();
        browser.waitForAngular();
        element(by.buttonText('SIGN OUT')).click();
        browser.sleep(2000); // it reloads page
        browser.waitForAngular();
        browser.sleep(2000); // it reloads page
        login('test_user', 'test_password').then(function() {
            browser.waitForAngular();
            blogs.openBlog(0).openSettings().openTeam();
            blogs.blog.settings.userName.getText().then(function(text) {
                expect(text).toEqual('test_user');
            });
        });
    });
});
