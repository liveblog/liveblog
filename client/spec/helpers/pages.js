'use strict';

var blogs = [
    [
        {
            title: 'title: end to end image',
            description: 'description: end to end image',
            username: 'Victor the Editor',
            picture_url: 'http://i.imgur.com/L0Ci8Yj.png'
        },
        {title: 'title: end To end three', description: 'description: end to end three', username: 'Victor the Editor'},
        {title: 'title: end to end two', description: 'description: end to end two', username: 'Victor the Editor'},
        {title: 'title: end to end One', description: 'description: end to end one', username: 'Victor the Editor'}
    ], [
        {title: 'title: end to end closed', description: 'description: end to end closed', username: 'Victor the Editor'}
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
            expect(currentBlog.element(by.css('[if-background-image]')).isPresent()).toBe(true);
        } else {
            expect(currentBlog.element(by.css('[if-background-image]')).isPresent()).toBe(false);
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

function ThemesManagerPage() {
    var self = this;
    self.themes = element.all(by.css('.theme'));
    self.blogsRows = element.all(by.repeater('blog in vm.selectedTheme.blogs'));
    self.fileThemeElement = element(by.css('#uploadAThemeFile'));
    self.byRemove = by.css('[ng-click="vm.removeTheme(theme)"]');
    self.byPreview = by.css('[ng-click="vm.openThemePreview(theme)"]');

    self.openThemesManager = function() {
        element(by.css('[ng-click="toggleMenu()"]')).click();
        browser.wait(function() {
            return element(by.css('[href="#/themes/"]')).isDisplayed();
        });
        element(by.css('[href="#/themes/"]')).click();
        return self;
    };

    self.setAsDefault = function(theme_index) {
        return self.themes.get(theme_index).element(by.css('[ng-click="vm.makeDefault(theme)"]')).click();
    };

    self.remove = function(theme_index) {
        self.themes.get(theme_index).element(self.byRemove).click();
        return self;
    };

    self.openPreview = function(theme_index) {
        self.themes.get(theme_index).element(self.byPreview).click().then(function() {
            expect(element(by.css('.theme-preview-modal .modal-dialog')).isDisplayed()).toBe(true);
            element(by.css('.theme-preview-modal .close')).click();
        });
        return self;
    };

    self.expectTheme = function(index, params) {
        var theme = self.themes.get(index);
        // check if it is the default theme
        expect(theme.element(by.css('.default-theme')).isDisplayed()).toBe(params.is_default_theme);
        // check if the name match
        if (params.name) {
            expect(theme.element(by.css('h3')).getText()).toBe(params.name);
        }
        //this only makes sense if the theme has at least one blog using it
        if (params.number_of_blogs_expected > 0) {
            var number_of_blog_elmt = theme.element(by.css('span[data-name=\'noOfBlogs\']'));
            // check if the number shown match
            expect(number_of_blog_elmt.getText()).toBe(params.number_of_blogs_expected.toString());
            // open the modal
            number_of_blog_elmt.click();
            // check if first row is displayed
            if (params.number_of_blogs_expected > 0) {
                expect(self.blogsRows.get(0).isDisplayed()).toBe(true);
            }
            // check if the number of row matchs
            expect(self.blogsRows.count()).toBe(params.number_of_blogs_expected);
            var close_modal = element(by.css('[ng-click="vm.closeThemeBlogsModal()"]'));
            close_modal.isPresent().then(function(is_present) {
                if (is_present) {
                    close_modal.click();
                }
            });
        }
    };
}

function BlogPage(blogs) {
    var self = this;
    self.blogs = blogs;
    self.drafts = new DraftsPage(self);
    self.contributions = new ContributionsPage(self);
    self.settings = new BlogSettingsPage(self);
    self.timeline = new TimelinePage(self);
    self.editor = new EditPostPage(self);

    self.openDrafts = function() {
        element(by.css('[ng-click="openPanel(\'drafts\')"]')).click();
        return self.drafts;
    };

    self.openEditor = function() {
        element(by.css('[ng-click="openPanel(\'editor\')"]')).click();
        return self.editor;
    };

    self.openContributions = function() {
        element(by.css('[ng-click="openPanel(\'contributions\')"]')).click();
        return self.contributions;
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

    self.expectNotificationsNo = function(notifsNo) {
        expect(element(by.css('span.notification-counter')).getText()).toBe(notifsNo.toString());
    };
}

function AbstractPanelPage(blog) {
    var self = this;
    self.blog = blog;
    self.column = element(by.css(self._class_name));
    self.byPosts = by.repeater('post in postsList.pagesManager.allPosts()');
    self.byEditButton = by.css('[ng-click="onEditClick(post)"]');
    self.byPublishButton = by.css('[ng-click="publishPost(post)"]');

    self.get = function(index) {
        return self.column.element(self.byPosts.row(index));
    };

    self.getFull = function(index) {
        return self.get(index).element(by.css('.lb-post__list')).getText();
    };

    self.all = function() {
        return self.column.all(self.byPosts);
    };

    self.editButtonIsPresent = function(draft) {
        return draft.element(self.byEditButton).isPresent();
    };

    self.edit = function(draft) {
        draft.element(self.byEditButton).click();
        return self;
    };

    self.publish = function(draft) {
        draft.element(self.byPublishButton).click();
        return self;
    };

    self.expectPost = function(index, data) {
        expect(self.get(index).element(by.css('[html-content]')).getText()).toContain(data);
        return self;
    };
}

DraftsPage.prototype = Object.create(AbstractPanelPage.prototype);
function DraftsPage(blog) {
    var self = this;
    self._class_name = '.panel--draft';
    AbstractPanelPage.call(self);
}

ContributionsPage.prototype = Object.create(AbstractPanelPage.prototype);
function ContributionsPage(blog) {
    var self = this;
    self._class_name = '.panel--contribution';
    self.byFilterBox = by.css('.dropdown-content');
    self.validFilterButton = element(self.byFilterBox).element(by.buttonText('SELECT'));
    AbstractPanelPage.call(self);

    self.openFiterByMember = function() {
        return self.column.element(by.css('.btn--plus')).click();
    };

    self.filterByMember = function(member_name) {
        return self.openFiterByMember().then(function() {
            element(self.byFilterBox)
            .element(by.css('[data-username="' + member_name + '"]'))
            .click().then(function() {
                return self.validFilterButton.click();
            });
        });
    };
}

function TimelinePage(blog) {
    var self = this;
    self.blog = blog;
    self.column = element(by.css('.column--timeline'));
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

    self.canBeMoved = function(index) {
        return self.column.element(self.byPosts.row(index)).element(self.byStartMoving).isPresent();
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
            expect(post.element(by.binding('post.user.display_name')).getText()).toBe(data.username);
        }
        return self;
    };
}

function EditPostPage() {
    var self = this;

    self.textElement = element(by.css('.editor .st-text-block'));
    self.quoteElement = element(by.css('.editor .st-quote-block'));
    self.fileElement = element(by.css('input[type="file"]'));
    self.imageElement = element(by.css('.st-block__editor img'));
    self.errorElement = element(by.css('.st-msg'));
    self.embedElement = element(by.css('.embed-input'));
    self.iframe = element(by.css('.liveblog--card iframe'));
    self.publishElement = element(by.css('[ng-click="publish()"]'));

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

    self.saveContribution = function() {
        return element(by.css('[ng-click="saveAsContribution()"]')).click();
    };

    self.waitForPublish = function() {
        browser.wait(function() {
            return self.publishElement.isEnabled();
        }, 200);
    };

    self.publish = function() {
        self.waitForPublish();
        return self.publishElement.click();
    };

    self.publishText = function(data) {
        data = (typeof data === 'string') ? data : randomString(10);
        self.textElement.clear().sendKeys(data);
        self.publish();
        return data;
    };

    self.getPublishStatus = function(data) {
        self.textElement.clear().sendKeys(data);
        return self.publishElement.isEnabled();
    };

    self.writeMultiplePost = function() {
        var data = {
            body: randomString(10),
            quote: randomString(10),
            author: randomString(10)
        };
        self.textElement.sendKeys(data.body);
        self.addTop()
            .addQuote(data);
        return data;
    };

    self.createDraft = function() {
        var data = self.writeMultiplePost();
        self.saveDraft();
        return data;
    };

    self.createContribution = function() {
        var data = self.writeMultiplePost();
        return self.saveContribution().then(function() {return data;});
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
        index = index || 2;
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

    self.removeBlog = function() {
        element(by.buttonText('REMOVE BLOG')).click().then(function() {
            element(by.css('.btn-primary')).click();
        });
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
        browser.sleep(1000);
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
exports.themeManager = new ThemesManagerPage();
