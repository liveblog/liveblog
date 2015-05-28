var utils = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils'),
    login = utils.login,
    expectBlog = require('./helpers/utils').expectBlog,
    openBlog = require('./helpers/utils').openBlog,
    blogs = require('./helpers/utils').blogs;

describe('Blog settings', function() {
    'use strict';

    var DEFAULT_LANGUAGE = 'english';
    var NEW_LANGUAGE = 'french';

    beforeEach(function(done) {login().then(done);});

    function openSettings() {
        // click on the settings button
        element(by.css('.settings-link')).click();
    }

    function expectSelectedLanguageIs(language) {
        expect(element(by.model('settings.blogPreferences.language')).$('option:checked').getText()).toEqual(language);
    }

    function setLanguage(language) {
        element(by.model('settings.blogPreferences.language')).sendKeys(language);
    }
    it('should modify title and description for blog', function() {
        var blog = {username: 'first name last name'};
        openBlog(0);
        openSettings();
        //modifying the title
        blog.title = 'ABC';
        var inputTitle = element(by.model('settings.newBlog.title'));
        inputTitle.clear();
        inputTitle.sendKeys(blog.title);
        //modifying the description
        blog.description = 'test description ABC';
        var inputDescription = element(by.model('settings.newBlog.description'));
        inputDescription.clear();
        inputDescription.sendKeys(blog.description);
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();
        element(by.css('[href="/#/liveblog"]')).click();
        expectBlog(blog);
    });

    it('shows the default language selected', function() {
        openBlog(0);
        openSettings();
        expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    });

    it('save a new value for language', function() {
        openBlog(0);
        openSettings();
        setLanguage(NEW_LANGUAGE);
        // save
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();
        openSettings();
        expectSelectedLanguageIs(NEW_LANGUAGE);
    });

    it('reset default language value', function() {
        openBlog(0);
        openSettings();
        setLanguage(NEW_LANGUAGE);
        // save a new value
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();
        openSettings();
        expectSelectedLanguageIs(NEW_LANGUAGE);
        // reset
        element(by.css('[ng-click="settings.reset()"]')).click();
        expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    });

    it('cancel changed language', function() {
        openBlog(0);
        openSettings();
        setLanguage(NEW_LANGUAGE);
        // cancel
        element(by.css('[ng-click="settings.close()"]')).click();
        browser.wait(function() {
            return element(by.css('.modal-footer.ng-scope')).isDisplayed();
        });
        element(by.css('button[ng-click="ok()"')).sendKeys(protractor.Key.ENTER);
        openSettings();
        expectSelectedLanguageIs(DEFAULT_LANGUAGE);
    });
    it('shows original creator full name and username', function() {
        openBlog(0);
        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        //expect original creator name
        element(by.css('[data="original-creator-display-name"]')).getText().then(function(text) {
            expect(text).toEqual('first name last name');
        });
        element(by.css('[data="original-creator-username"]')).getText().then(function(text) {
            expect(text).toEqual('test_user');
        });
    });
    it('changes blog ownership', function() {
        openBlog(0);
        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        element(by.buttonText('CHANGE OWNER')).click();
        element(by.repeater('user in settings.avUsers').row(1).column('user.display_name')).click();
        element(by.buttonText('SELECT')).click();
        element(by.css('[ng-click="settings.saveAndClose()"]')).click();

        openSettings();
        element(by.css('[data="blog-settings-team"]')).click();
        element(by.css('[data="original-creator-username"]')).getText().then(function(text) {
            expect(text).toEqual('admin');
        });
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
