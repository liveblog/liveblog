var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    producersManagement = require('./helpers/pages').producersManagement;

function assertToastMsg(type, msg) {
    var cssSelector = '.notification-holder .alert-' + type,
        toast = $(cssSelector);

    browser.sleep(500);
    browser.ignoreSynchronization = true;
    expect(toast.getText()).toContain(msg);
    browser.sleep(500);
    browser.ignoreSynchronization = false;
}

var producer = {
    name: 'Massey Fergusson',
    api_url: 'http://www.masseyferguson.de/api',
    consumer_api_key: '1234567890qwerty'
}

fdescribe('Producers', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    describe('list', function() {
        it('can open producers managements and list the producers', function() {
            producersManagement.openProducersManagement();

            element.all(by.repeater('producer in producers'))
                .count()
                .then(function(count) {
                    expect(count).toEqual(1);
                });
        });
    });
});
