'use strict';

var blogs = [
    {title: 'title: end to end image', description: 'description: end to end image', username: 'first name last name'},
    {title: 'title: end To end three', description: 'description: end to end three', username: 'first name last name'},
    {title: 'title: end to end two', description: 'description: end to end two', username: 'first name last name'},
    {title: 'title: end to end One', description: 'description: end to end one', username: 'first name last name'}
];

function waitForModal() {
    browser.wait(function() {
        return element(by.css('.modal-footer.ng-scope')).isDisplayed();
    });
    return this;
}
function okModal() {
    element(by.css('[ng-click="ok()"]')).click();
    return this;
}
function BlogListPage() {
    var self = this;

    self.blog = new BlogPage(self);

    self.blogs = blogs;

    self.cloneBlog = function(index) {
        index = index || 0;
        return JSON.parse(JSON.stringify(blogs[0]))
    }

    self.waitForModal = waitForModal;

    self.openBlog = function(index) {
        index = index || 0;
        element(by.repeater('blog in blogs._items').row(index).column('blog.title')).click();
        return self.blog;
    }

    self.expectBlog = function(blog, index) {
        index = index || 0;
        var allBlogs = element.all(by.repeater('blog in blogs._items')),
            currentBlog = allBlogs.get(index);

        expect(currentBlog.element(by.binding('blog.title')).getText()).toBe(blog.title);
        expect(currentBlog.element(by.binding('blog.description')).getText()).toBe(blog.description);
        if (blog.picture_url) {
            expect(currentBlog.getAttribute('if-background-image')).not.toBe('');
        }
        expect(currentBlog.element(by.binding('blog.original_creator | username')).getText())
        .toBe(blog.username);
    }

    self.expectCount = function(count) {
        expect(element.all(by.repeater('blog in blogs._items')).count()).toEqual(count);
    }
}

function BlogPage(list) {
    var self = this;

    self.list = list;

    self.settings = new BlogSettingsPage(self);

    self.openList = function() {
        element(by.css('[class="icon-th-large"]')).click();
        return self.list;
    }

    self.openArchive =  function() {
        element(by.repeater('state in states').row(0).column('state.text')).click();
    }

    self.openSettings = function() {
        element(by.css('.settings-link')).click();
        return self.settings
    }
}

function BlogSettingsPage(blog) {
    var self = this;

    self.blog = blog;
    self.title = element(by.model('settings.newBlog.title'));
    self.description = element(by.model('settings.newBlog.description'));
    self.file = element(by.css('input[type="file"]'));
    self.saveAndClose = element(by.css('[ng-click="settings.saveAndClose()"]'));

    self.displayName = element(by.css('[data="original-creator-display-name"]'));
    self.userName = element(by.css('[data="original-creator-username"]'));
    // bind modal global methods.
    self.waitForModal = waitForModal.bind(self);
    self.okModal = okModal.bind(self);

    self.done = function() {
        self.saveAndClose.click();
        return self.blog;
    }
    self.waitDone = function() {
        browser.wait(function() {
            return self.saveAndClose.isEnabled();
        });
        return self;
    }
    self.save = function() {
        element(by.css('[ng-click="settings.save()"]')).click();
        return self;
    }
    self.openTeam = function() {
        element(by.css('[data="blog-settings-team"]')).click();
        return self;
    }

    self.changeStatus = function() {
        element(by.css('[data-blog-status-switch]')).click();
        return self;
    }

    self.openUploadModal = function() {
        element(by.css('[ng-click="settings.openUploadModal()"]')).click();
        return self;
    }

    self.upload = function() {
        element(by.buttonText('UPLOAD')).click();
        return self;
    }

    self.removeImage = function() {
        element(by.css('[ng-click="settings.removeImage()"]')).click();
        return self;
    }
}

function randomString(maxLen) {
    maxLen = maxLen || 15;
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < maxLen; i ++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

exports.list = new BlogListPage();
exports.blogs = blogs;
exports.randomString = randomString;
