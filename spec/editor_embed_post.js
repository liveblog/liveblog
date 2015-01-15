var openUrl = require('./helpers/utils').open;
describe('editor-embed:', function() {
    'use strict';

    var youtube_url = 'https://www.youtube.com/watch?v=Ksd-a9lIIDc';

    beforeEach(openUrl('/#/liveblog'));

    it('blogs list:', function() {
        openBlog(0);
        // click on the "+" bar
        element(by.css('[class="st-block-controls__top"]')).click();
        // click on the embed button
        element(by.css('[data-type="link"]')).click();
        // write a youtube url
        element(by.css('.link-input')).sendKeys(youtube_url);
        // wait for an iframe
        var iframe = element(by.css('.liveblog--card iframe'));
        browser.wait(function() {return iframe.isPresent();});
        expect(iframe.isPresent()).toBe(true);
    });

    function openBlog(index) {
        index = index || 0;
        element(by.repeater('blog in blogs._items').row(index).column('blog.title')).click();
    }

});
