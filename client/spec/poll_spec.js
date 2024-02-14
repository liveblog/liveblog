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
  
    it('can set days, hours, and minutes in poll block', function() {
          var editor = blogs.openBlog(0).editor
                              .addTop()
                              .addPoll()
                              .setDays(2)
                              .setHours(3)
                              .setMinutes(30);
          var days = element(by.id('poll_days_input')).getAttribute('value');
          var hours = element(by.id('poll_hours_input')).getAttribute('value');
          var minutes = element(by.id('poll_minutes_input')).getAttribute('value');
          expect(days).toEqual('12');
          expect(hours).toEqual('03');
          expect(minutes).toEqual('030');
    });

    it('can reset the poll block', function() {
          var editor = blogs.openBlog(0).editor
                              .addTop()
                              .addPoll()
                              .setDays(2)
                              .setHours(3)
                              .setMinutes(30)
                              .addOption()
                              .resetPoll();
          var days = element(by.id('poll_days_input')).getAttribute('value');
          var hours = element(by.id('poll_hours_input')).getAttribute('value');
          var minutes = element(by.id('poll_minutes_input')).getAttribute('value');
          var optionsCount = element.all(by.css('.poll_option_container input[type="text"]')).count();
          expect(days).toEqual('1');
          expect(hours).toEqual('0');
          expect(minutes).toEqual('0');
          expect(optionsCount).toEqual(2);
    });
});
