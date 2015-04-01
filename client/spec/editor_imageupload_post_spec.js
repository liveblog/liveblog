var path = require('path');
var openUrl = require('./helpers/utils').open;
var openBlog = require('./helpers/utils').openBlog;
var rootDir = path.resolve(__dirname, '..');

describe('editor image upload:', function() {
    'use strict';

    beforeEach(function(done) {openUrl('/#/liveblog').then(done);});

    it('upload an image and show it in the editor', function() {
        openBlog(0);
        // click on the "+" bar
        element(by.css('[class="st-block-controls__top"]')).click();
        // click on the image button
        element(by.css('[data-type="image"]')).click();
        // add a picture to be uploaded
        element(by.css('input[type="file"]')).sendKeys(rootDir + '/app/images/superdesk-icon-large.png');
        // wait for an image
        var image = element(by.css('.st-block__editor img'));
        image.getAttribute('src').then(function(src) {
            // there is an image
            expect(src).toBeDefined();
            // no error messages
            expect(element(by.css('.st-msg')).isPresent()).toBe(false);
            return src;
        });
    });
});
