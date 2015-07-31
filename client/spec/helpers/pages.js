'use strict';

var blogs = [
    [
        {title: 'title: end to end image', description: 'description: end to end image', username: 'first name last name'},
        {title: 'title: end To end three', description: 'description: end to end three', username: 'first name last name'},
        {title: 'title: end to end two', description: 'description: end to end two', username: 'first name last name'},
        {title: 'title: end to end One', description: 'description: end to end one', username: 'first name last name'}
    ], [
        {title: 'title: end to end closed', description: 'description: end to end closed', username: 'first name last name'}
    ]
], stateMap = {
    'active': 0,
    'archived': 1
};

function waitForModal() {
     /*jshint validthis: true */
    browser.wait(function() {
        return element(by.css('.modal-footer')).isDisplayed();
    }, 1000);
    return this;
}
function okModal() {
     /*jshint validthis: true */
    element(by.css('[ng-click="ok()"]')).click();
    return this;
}
function BlogsPage() {
    var self = this;

    self.blog = new BlogPage(self);
    self.team = new TeamPage(self);

    self.blogs = blogs;

    self.cloneBlog = function(index, state) {
        index = index || 0;
        state = state || 0;
        if (parseInt(state, 10) !== state){
            state = stateMap[state];
        }
        return JSON.parse(JSON.stringify(self.blogs[state][index]));
    };

    self.waitForModal = waitForModal.bind(self);

    self.title = element(by.model('newBlog.title'));
    self.description = element(by.model('newBlog.description'));
    self.file = element(by.css('input[type="file"]'));

    self.gridElement = element(by.css('.list-container table'));

    self.switchView = function() {
        element(by.css('button[ng-show="gridview"]')).click();
    };

    self.getActiveBlogs = function() {
        return self.blogs[0];
    };

    self.getArchivedBlogs = function() {
        return self.blogs[1];
    };

    self.searchBlogs = function(search) {
        element(by.css('[ng-click="flags.extended = !flags.extended"]')).click();
        element(by.model('q')).clear().sendKeys(search.search);
        browser.getCurrentUrl().then(function(url) {
            expect(url.indexOf('q=' + search.search)).toBeGreaterThan(-1);
        }
        ).then(function () {
            self.expectCount(search.blogs.length);
            for (var j = 0, countj = search.blogs.length; j < countj; j++) {
                self.expectBlog(self.blogs[0][search.blogs[j]], j);
            }
        });
        return self;
    };

    self.openCreateBlog = function() {
        element(by.css('[ng-click="openNewBlog();"]')).click();
        return self;
    };

    self.createBlogNext = function() {
        element(by.buttonText('NEXT')).click();
        return self;
    };

    self.createBlogCreate = function() {
        element(by.buttonText('CREATE')).click();
        return self.blog;
    };

    self.openBlog = function(index) {
        index = index || 0;
        element(by.repeater('blog in blogs._items').row(index).column('blog.title')).click();
        return self.blog;
    };

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
    };

    self.expectCount = function(count) {
        expect(element.all(by.repeater('blog in blogs._items')).count()).toEqual(count);
    };

    self.selectState = function(state) {
        state = state || 1;
        if (parseInt(state, 10) !== state){
            state = stateMap[state];
        }
        element(by.repeater('state in states').row(state).column('state.text')).click();
        return self;
    };
}

function BlogPage(blogs) {
    var self = this;
    self.blogs = blogs;

    self.drafts = new DraftsPage(self);
    self.settings = new BlogSettingsPage(self);
    self.timeline = new TimelinePage(self);
    self.editor = new EditPostPage(self);

    self.openDrafts = function() {
        element(by.css('[ng-click="toggleDraftPanel()"]')).click();
        return self.drafts;
    };

    self.openList = function() {
        element(by.css('[class="icon-th-large"]')).click();
        return self.blogs;
    };

    self.openArchive =  function() {
        element(by.repeater('state in states').row(0).column('state.text')).click();
    };

    self.openSettings = function() {
        element(by.css('.settings-link')).click();
        return self.settings;
    };
}

function DraftsPage(blog) {
    var self = this;
    self.blog = blog;
    self.editor = new EditPostPage(self);
    self.posts = element(by.css('.draft-posts'));
    self.column = element(by.css('.column-draft-posts'));
    self.byDrafts = by.repeater('post in postsList.pagesManager.allPosts()');

    self.get = function(index) {
        return self.column.element(self.byDrafts.row(index));
    };

    self.getFull = function(index) {
        return self.get(index).element(by.css('.lb-post__list')).getText();
    };

    self.all = function() {
        return self.column.all(self.byDrafts);
    };

    self.edit = function(draft) {
        draft.element(by.css('[ng-click="onEditClick(post)"]')).click();
        return self.editor;
    };

    self.expectPost = function(index, data) {
        expect(self.get(index).element(by.css('[html-content]')).getText()).toContain(data);
        return self;
    };
}

function TimelinePage(blog) {
    var self = this;
    self.blog = blog;
    self.column = element(by.css('.column-timeline'));
    self.byPosts = by.repeater('post in posts');
    self.byEdit = by.css('[ng-click="onEditClick(post)"]');
    self.byUnpublish = by.css('[ng-click="unpublishPost(post)"]');
    self.byStartMoving = by.css('[ng-click="preMovePost(post);"]');
    self.byMoveTo = by.css('[ng-click="movePost(index, \'above\');"]');
    self.byRemove = by.css('[ng-click="askRemovePost(post)"]');
    self.waitForModal = waitForModal.bind(self);
    self.okModal = okModal.bind(self);

    self.get = function(index) {
        return self.column.element(self.byPosts.row(index));
    };

    self.getText = function(index) {
        return self.get(index).element(by.css('[lb-bind-html]')).getText();
    };

    self.getFull = function(index) {
        return self.get(index).element(by.css('.lb-post__list')).getText();
    };

    self.getUpdated = function(index) {
        return self.get(index).element(by.css('.updated-time')).getText();
    };

    self.edit = function(index) {
        self.column.element(self.byPosts.row(index)).element(self.byEdit).click();
        return self;
    };

    self.unpublish = function(index) {
        self.column.element(self.byPosts.row(index)).element(self.byUnpublish).click();
        return self;
    };

    self.startMoving = function(index) {
        self.column.element(self.byPosts.row(index)).element(self.byStartMoving).click();
        return self;
    };

    self.moveTo = function(index) {
        self.column.element(self.byPosts.row(index)).element(self.byMoveTo).click();
        return self;
    };

    self.remove = function(index) {
        self.column.element(self.byPosts.row(index)).element(self.byRemove).click();
        return self;
    };

    self.all = function() {
        return self.column.all(self.byPosts);
    };

    self.expectPost = function(index, data) {
        var post = self.get(index);
        expect(self.getText(index)).toBe(data.text);
        if (data.username) {
            expect(post.element(by.binding('post.original_creator_name')).getText()).toBe(data.username);
        }
        return self;
    };
}

function EditPostPage() {
    var self = this;

    self.textElement = element(by.css('.editor .st-text-block'));
    self.fileElement = element(by.css('input[type="file"]'));
    self.imageElement = element(by.css('.st-block__editor img'));
    self.errorElement = element(by.css('.st-msg'));
    self.embedElement = element(by.css('.embed-input'));
    self.iframe = element(by.css('.liveblog--card iframe'));

    self.addTop = function() {
        // click on the "+" bar
        element(by.css('.st-block-controls__top')).click();
        return self;
    };

    self.addImage = function() {
        element(by.css('[data-type="image"]')).click();
        return self;
    };

    self.addQuote = function(data) {
        // click on the quote button
        element(by.css('[data-type="quote"]')).click();
        element(by.css('.editor .quote-input')).sendKeys(data.quote);
        element(by.css('.editor .js-cite-input')).sendKeys(data.author);
        return self;
    };

    self.addEmbed = function() {
        element(by.css('[data-type="embed"]')).click();
        return self;
    };

    self.saveDraft = function() {
        element(by.css('[ng-click="saveAsDraft()"]')).click();
        return self;
    };

    self.publish = function() {
        return element(by.css('[ng-click="publish()"]')).click();
    };

    self.publishText = function() {
        var data = randomString(10);
        self.textElement.clear().sendKeys(data);
        self.publish();
        return data;
    };

    self.createDraft = function() {
        var data = {
            body: randomString(10),
            quote: randomString(10),
            author: randomString(10)
        };
        self.textElement.sendKeys(data.body);
        self.addTop()
            .addQuote(data)
            .saveDraft();
        return data;
    };

    self.resetEditor = function() {
        element(by.css('[ng-click="askAndResetEditor()"]')).click().then(function() {
            browser.wait(function() {
                return element(by.css('.editor .st-text-block')).isPresent();
            });
            expect(element(by.css('.editor .st-text-block')).getText()).toEqual('');
        });
        return self;
    };

    self.waitForEditor = function() {
        browser.wait(function() {
            return element(by.css('.editor .st-text-block')).isPresent();
        });
        return self;
    };
}

function BlogSettingsPage(blog) {
    var self = this;

    self.team = new TeamPage();
    self.blog = blog;
    self.title = element(by.model('settings.newBlog.title'));
    self.description = element(by.model('settings.newBlog.description'));
    self.file = element(by.css('input[type="file"]'));
    self.saveAndClose = element(by.css('[ng-click="settings.saveAndClose()"]'));

    self.displayName = element(by.css('[data="original-creator-display-name"]'));
    self.userName = element(by.css('[data="original-creator-username"]'));

    self.contributors = element(by.css('.subsettings-content:nth-child(5)')).all(by.repeater('member in settings.members'));

    // bind modal global methods.
    self.waitForModal = waitForModal.bind(self);
    self.okModal = okModal.bind(self);

    self.done = function() {
        self.saveAndClose.click();
        return self.blog;
    };
    self.waitDone = function() {
        browser.wait(function() {
            return self.saveAndClose.isEnabled();
        });
        return self;
    };
    self.save = function() {
        element(by.css('[ng-click="settings.save()"]')).click();
        return self;
    };
    self.openTeam = function() {
        element(by.css('[data="blog-settings-team"]')).click();
        return self;
    };

    self.switchStatus = function() {
        element(by.css('[data-blog-status-switch]')).click();
        return self;
    };

    self.openUploadModal = function() {
        element(by.css('[ng-click="settings.openUploadModal()"]')).click();
        return self;
    };

    self.upload = function() {
        element(by.buttonText('UPLOAD')).click();
        return self;
    };

    self.removeImage = function() {
        element(by.css('[ng-click="settings.removeImage()"]')).click();
        return self;
    };

    self.changeOwner = function() {
        element(by.css('[data-button="CHANGE OWNER"]')).click();
        return self;
    };

    self.changeToOwner = function(index) {
        index = index || 1;
        element(by.repeater('user in settings.avUsers').row(index).column('user.display_name')).click();
        return self;
    };

    self.selectOwner = function() {
        element(by.buttonText('SELECT')).click();
        return self;
    };

    self.editTeam = function() {
        element(by.css('[data-button="EDIT TEAM"]')).click();
        return self;
    };

    self.doneTeamEdit = function() {
        element(by.css('[ng-click="settings.doneTeamEdit()"')).click();
        return self;
    };
}

function TeamPage() {
    var self = this;
    self.searchUser = function(search) {
        element(by.model('search')).sendKeys(search);
        return self;
    };

    self.waitChooseUser = function() {
        browser.wait(function() {
            return element(by.css('[ng-click="choose(user)"]')).isPresent();
        }, 5000);
        return self;
    };

    self.changeToUser = function(index) {
        index = index || 0;
        element(by.repeater('user in users._items').row(index)).click();
        return self;
    };
}

function GeneralSettingsPage() {
    var self = this;

    self.themeModel = 'liveblogSettings.theme.value';

    self.open = function() {
        element(by.css('[ng-click="toggleMenu()"]')).click();
        browser.wait(function() {
            return element(by.css('[href="#/settings"]')).isDisplayed();
        });
        element(by.css('[href="#/settings"]')).click();
        return self;
    };

    self.save = function() {
        browser.wait(function() {
            return element(by.css('[ng-click="saveSettings()"]')).isEnabled();
        });
        element(by.css('[ng-click="saveSettings()"]')).click();
        return self;
    };

    self.setSelected = function(model, value) {
        element(by.model(model)).sendKeys(value);
        return self;
    };

    self.setTheme = function(value) {
        self.setSelected(self.themeModel, value);
        return self;
    };

    self.expectSelected = function(model, value) {
        browser.waitForAngular();
        browser.wait(function() {
            return element(by.model(model)).element(by.css('option:checked')).isDisplayed();
        });
        expect(element(by.model(model)).element(by.css('option:checked')).getText()).toEqual(value);
    };

    self.expectTheme = function(value) {
        self.expectSelected(self.themeModel, value);
        return self;
    };
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

exports.blogs = new BlogsPage();
exports.generalSettings = new GeneralSettingsPage();
exports.randomString = randomString;
