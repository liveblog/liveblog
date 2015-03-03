var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;
var randomString = require('./helpers/utils').randomString;

describe('Draft Posts', function() {
    'use strict';

    beforeEach(openUrl('/#/liveblog'));

    function createDraft(body) {
        var data = {
            body: randomString(10),
            quote: randomString(10),
            author: randomString(10)
        };
        element(by.css('.st-text-block')).sendKeys(data.body);
        // click on the "+" bar
        element(by.css('.st-block-controls__top')).click();
        // click on the quote button
        element(by.css('[data-type="quote"]')).click();
        element(by.css('.quote-input')).sendKeys(data.quote);
        element(by.css('.js-cite-input')).sendKeys(data.author);
        element(by.css('[ng-click="saveAsDraft()"]')).click();
        return data;
    }

    function checkDraftInDraftList(row_expected, data_expected) {
        expect(element(by.repeater('post in draftPosts.posts').row(row_expected))
            .element(by.tagName('article')).getText()
        ).toContain(data_expected);
    }

    function openDraftBar() {
        element(by.css('[ng-click="toggleDraftPanel()"]')).click();
    }

    function resetEditor() {
        element(by.css('[ng-click="resetEditor()"]')).click();
        expect(element(by.css('.st-text-block')).getText()).toEqual('');
    }

    it('can create drafts and respect the order', function() {
        openBlog(0);
        var draft1 = createDraft();
        var draft2 = createDraft();
        // open drafts bar
        openDraftBar();
        // check
        checkDraftInDraftList(0, draft2.quote);
        checkDraftInDraftList(1, draft1.quote);
    });

    it('can open a draft in the editor', function() {
        openBlog(0);
        var draft = createDraft();
        resetEditor();
        // open drafts bar
        openDraftBar();
        element(by.repeater('post in draftPosts.posts').row(0)).click();
        expect(element(by.css('.st-text-block')).getText()).toEqual(draft.body);
    });

});
