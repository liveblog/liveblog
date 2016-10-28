'use strict';

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
    apiUrl: 'http://www.masseyferguson.de/api',
    consumerApiKey: '1234567890qwerty'
};

describe('Producers', function() {
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

        it('can create a new producer', function() {
            producersManagement.openProducersManagement();

            element(by.css('button.navbtn.sd-create-btn'))
                .click()
                .then(function() {
                    return element(by.css('input#name')).isDisplayed();
                })
                .then(function() {
                    return element(by.css('input#name'))
                        .sendKeys(producer.name);
                })
                .then(function() {
                    return element(by.css('input#api-url'))
                        .sendKeys(producer.apiUrl);
                })
                .then(function() {
                    return element(by.css('input#consumer-api-key'))
                        .sendKeys(producer.consumerApiKey);
                })
                .then(function() {
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(function() {
                    return assertToastMsg('success', 'producer saved.');
                })
                .then(function() {
                    var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
                    expect(firstRowName.getText()).toEqual(producer.name);
                    return element.all(by.repeater('producer in producers')).count();
                })
                .then(function(count) {
                    expect(count).toEqual(2);
                });
        });

        it('can update a producer', function() {
            producersManagement.openProducersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
            expect(firstRowName.getText()).toEqual('John Deere');

            firstRowName
                .click()
                .then(function() {
                    return element(by.css('input#name')).isDisplayed();
                })
                .then(function() {
                    return element(by.css('input#name')).clear();
                })
                .then(function() {
                    return element(by.css('input#name')).sendKeys(producer.name);
                })
                .then(function() {
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(function() {
                    return assertToastMsg('success', 'producer saved.');
                })
                .then(function() {
                    var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
                    expect(firstRowName.getText()).toEqual(producer.name);
                    return element.all(by.repeater('producer in producers')).count();
                })
                .then(function(count) {
                    expect(count).toEqual(1);
                });
        });

        it('can delete a producer', function() {
            producersManagement.openProducersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
            expect(firstRowName.getText()).toEqual('John Deere');

            var elemToHover = element(by.css('ul.table-body div.row-wrapper'));

            browser.actions().mouseMove(elemToHover, {x: 3, y: 3}).perform()
                .then(function() {
                    return element(by.css('ul.table-body li a.delete-producer'))
                        .click();
                })
                .then(function() {
                    return element.all(by.repeater('producer in producers')).count();
                })
                .then(function(count) {
                    expect(count).toEqual(0);
                });
});
    });
});
