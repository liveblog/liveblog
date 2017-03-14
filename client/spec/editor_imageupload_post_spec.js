var path = require('path'),
    login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs,
    rootDir = path.resolve(__dirname, '..');

// TODO: Remove image upload for now because of known issues
// https://github.com/SeleniumHQ/selenium/wiki/Frequently-Asked-Questions#user-content-q-does-webdriver-support-file-uploads
//describe('editor image upload:', function() {
//    'use strict';

//    beforeEach(function(done) {
//        browser.ignoreSynchronization = true;
//        login()
//            .then(() => browser.ignoreSynchronization = false)
//            .then(done);
//    });

//    it('upload an image and show it in the editor', function() {
//        var editor = blogs.openBlog(0).editor
//                            .addTop()
//                            .addImage();

//        editor.fileElement.sendKeys(rootDir + '/app/images/superdesk-icon-large.png');

//        // wait for an image
//        editor.imageElement.getAttribute('src').then(function(src) {
//            // there is an image
//            expect(src).toBeDefined();
//            // no error messages
//            expect(editor.errorElement.isPresent()).toBe(false);
//            return src;
//        });
//    });
//});
