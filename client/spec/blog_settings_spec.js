var utils = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils'),
    login = utils.login,
    randomString = require('./helpers/pages').randomString,
    list = require('./helpers/pages').list;

describe('Blog settings', function() {
    'use strict';

    // FIXME: must be uncommented after release (LBSD-546)
    // var DEFAULT_LANGUAGE = 'english';
    // var NEW_LANGUAGE = 'french';

    beforeEach(function(done) {login().then(done);});

    // FIXME: must be uncommented after release (LBSD-546)
    // function expectSelectedLanguageIs(language) {
    //     expect(element(by.model('settings.blogPreferences.language')).$('option:checked').getText()).toEqual(language);
    // }

    // function setLanguage(language) {
    //     element(by.model('settings.blogPreferences.language')).sendKeys(language);
    // }

    it('should modify title and description for blog', function() {
        var blog = list.cloneBlog();
        blog.title = randomString();
        blog.description = randomString();

        list.openBlog().openSettings();
        list.blog.settings.title.clear().sendKeys(blog.title);
        list.blog.settings.description.clear().sendKeys(blog.description);
        list.blog.settings.done()
                .openList()
            .expectBlog(blog);
    });

    it('should change the image for blog', function() {
        var path = require('path'),
            blog = list.cloneBlog();
        blog.picture_url = './upload/-o-jpg-1600-900.jpg';

        list.openBlog().openSettings();

        list.blog.settings.openUploadModal();
        list.blog.settings.file.sendKeys(path.resolve(__dirname, blog.picture_url));
        list.blog.settings
                    .upload()
                    .done()
                .openList()
            .expectBlog(blog);
    });

    it('should remove the image from blog', function() {
        var blog = list.cloneBlog();
        delete blog.picture_url;

        list.openBlog().openSettings();
        list.blog.settings
                    .removeImage()
                    .waitForModal()
                    .okModal()
                    .waitDone()
                    .done()
                .openList()
            .expectBlog(blog);
    });

    // FIXME: must be uncommented after release (LBSD-546)
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
        list.openBlog().openSettings().openTeam();
        list.blog.settings.displayName.getText().then(function(text) {
            expect(text).toEqual('first name last name');
        });
        list.blog.settings.userName.getText().then(function(text) {
            expect(text).toEqual('test_user');
        });
    });

    it('changes blog ownership', function() {
        openBlog(0);
        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        element(by.css('[data-button="CHANGE OWNER"]')).click();
        element(by.repeater('user in settings.avUsers').row(1).column('user.display_name')).click();
        element(by.buttonText('SELECT')).click();
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();

        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        element(by.css('[data="original-creator-username"]')).getText().then(function(text) {
            expect(text).toEqual('admin');
        });
    });
    it('ads a team member from blog settings', function() {
        openBlog(0);
        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        element(by.css('[data-button="EDIT TEAM"]')).click();
        element(by.model('search')).sendKeys('s');
        browser.wait(function() {
            return browser.driver.isElementPresent(by.css('[ng-click="choose(user)"]'));
        }, 5000);
        element(by.repeater('user in users._items').row(0)).click();
        element(by.css('[ng-click="settings.doneTeamEdit()"')).click();
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();
        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        expect(element(by.css('.subsettings-content:nth-child(5)')).all(by.repeater('member in settings.members')).count()).toBe(1);
    });
    it('should archive a blog', function() {
        //open first blog
        openBlog(0);
        openSettings();
        element(by.css('[data-blog-status-switch]')).click();
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();
        //click on back to liveblog list
        element(by.css('[class="icon-th-large"]')).click();
        //go to archive blogs
        element(by.repeater('state in states').row(1).column('state.text')).click();
        //expect the first blog to be the one we archived (blog[0])
        expect(blogs[0], 0);
    });
    it('should activate a blog', function() {
        //go to archive blogs
        element(by.repeater('state in states').row(1).column('state.text')).click();
        //open first blog
        openBlog(0);
        openSettings();
        element(by.css('[data-blog-status-switch]')).click();
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();
        //click on back to liveblog list
        element(by.css('[class="icon-th-large"]')).click();
        //go to archive blogs
        //click to go to active blogs
        element(by.repeater('state in states').row(0).column('state.text')).click();
        //expect the first blog to be the one we activated (blog[0])
        expect(blogs[0], 0);
    });
});
