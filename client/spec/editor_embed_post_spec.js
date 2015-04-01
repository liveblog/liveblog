var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;

describe('editor embed:', function() {
    'use strict';

    var youtube_url = 'https://www.youtube.com/watch?v=Ksd-a9lIIDc';

    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});

    it('add a youtube iframe in the editor', function() {
        openBlog(0);
        // click on the "+" bar
        element(by.css('[class="st-block-controls__top"]')).click();
        // click on the embed button
        element(by.css('[data-type="embed"]')).click();
        // write a youtube url
        element(by.css('.embed-input')).sendKeys(youtube_url);
        // wait for an iframe
        var iframe = element(by.css('.liveblog--card iframe'));
        browser.wait(function() {return iframe.isPresent();});
        expect(iframe.isPresent()).toBe(true);
    });

});
