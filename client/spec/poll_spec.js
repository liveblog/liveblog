var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('Poll functionality', function() {
    'use strict';

    beforeEach(function(done) {
        login().then(done);
    });

    it('can add option in poll block', function() {
          var editor = blogs.openBlog(0).editor
                              .addTop()
                              .addPoll()
                              .addOption();
          var optionsCount = element.all(by.css('.poll_option_container input[type="text"]')).count();
          expect(optionsCount).toEqual(3);
    });
  
    it('can remove option in poll block', function() {
          var editor = blogs.openBlog(0).editor
                              .addTop()
                              .addPoll()
                              .removeOption();
          var optionsCount = element.all(by.css('.poll_option_container input[type="text"]')).count();
          expect(optionsCount).toEqual(1);
    });
});
