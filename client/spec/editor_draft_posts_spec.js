var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;
var randomString = require('./helpers/utils').randomString;

describe('Draft Posts', function() {
    'use strict';

    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});

    function createDraft(body) {
        var data = {
            body: randomString(10),
            quote: randomString(10),
            author: randomString(10)
        };
        element(by.css('.editor .st-text-block')).sendKeys(data.body);
        // click on the "+" bar
        element(by.css('.st-block-controls__top')).click();
        // click on the quote button
        element(by.css('[data-type="quote"]')).click();
        element(by.css('.editor .quote-input')).sendKeys(data.quote);
        element(by.css('.editor .js-cite-input')).sendKeys(data.author);
        element(by.css('[ng-click="saveAsDraft()"]')).click();
        return data;
    }

    function checkDraftInDraftList(row_expected, data_expected) {
        expect(element(by.repeater('post in draftPosts.posts').row(row_expected))
            .element(by.css('[html-content]')).getText()
        ).toContain(data_expected);
    }

    function openDraftBar() {
        element(by.css('[ng-click="toggleDraftPanel()"]')).click();
    }

    function resetEditor() {
        element(by.css('[ng-click="askAndResetEditor()"]')).click().then(function() {
            browser.wait(function() {
                return element(by.css('.editor .st-text-block')).isPresent();
            });
            expect(element(by.css('.editor .st-text-block')).getText()).toEqual('');
        });
    }

    it('can create drafts and respect the order', function() {
        openBlog(0);
        openDraftBar();
        var draft1 = createDraft();
        var draft2 = createDraft();
        // check
        checkDraftInDraftList(0, draft2.quote);
        checkDraftInDraftList(1, draft1.quote);
    });

    it('can open a draft in the editor and publish it', function() {
        openBlog(0);
        openDraftBar();
        var draft = createDraft();
        resetEditor();
        browser.waitForAngular();
        var first_post = element(by.repeater('post in draftPosts.posts').row(0));
        first_post.element(by.css('[ng-click="onEditClick(post)"]')).click();
        browser.wait(function() {
            return element(by.css('.editor .st-text-block')).isPresent();
        });
        expect(element(by.css('.editor .st-text-block')).getText()).toEqual(draft.body);
        // and publish it
        element(by.css('[ng-click="publish()"]')).click().then(function() {
            expect(element(by.repeater('post in posts').row(0)).isPresent()).toBe(true);
            expect(element.all(by.repeater('post in draftPosts.posts')).count())
                .toBe(0);
        });
    });
});
