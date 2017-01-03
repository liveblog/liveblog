'use strict';

var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils').login,
    producersManagement = require('./helpers/pages').producersManagement,
    assertToastMsg = require('./helpers/assert-toast-msg');

var producer = {
    name: 'Massey Fergusson',
    apiUrl: 'http://www.masseyferguson.de/api',
    consumerApiKey: '1234567890qwerty'
};

var contact = {
    firstName: 'Chuck',
    lastName: 'Norris',
    email: 'gmail@chucknorris.com'
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

        it('can show an error when some required field are empty', function() {
            producersManagement.openProducersManagement();

            element(by.css('button.navbtn.sd-create-btn'))
                .click()
                .then(function() {
                    return element(by.css('input#name')).isDisplayed();
                })
                .then(function() {
                    return element(by.css('input[name="first_name"]'))
                        .sendKeys(contact.firstName);
                })
                .then(function() {
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(function() {
                    var fieldName = 'div[ng-show="producerForm.attempted &&' +
                        ' producerForm.name.$error.required"]';

                    return expect(
                        $(fieldName).isDisplayed()
                    ).toBeTruthy();
                })
                .then(function() {
                    var fieldName = 'div[ng-show="producerForm.attempted &&' +
                        ' producerForm.api_url.$error.required"]';

                    return expect(
                        $(fieldName).isDisplayed()
                    ).toBeTruthy();
                })
                .then(function() {
                    return expect(
                        $('div[ng-show="attempted && contactForm.first_name.$error.required"]')
                            .isDisplayed()
                    ).toBeFalsy();
                })
                .then(function() {
                    return expect(
                        $('div[ng-show="attempted && contactForm.last_name.$error.required"]')
                            .isDisplayed()
                    ).toBeTruthy();
                })
                .then(function() {
                    return expect(
                        $('div[ng-show="attempted && contactForm.email.$error.required"]')
                            .isDisplayed()
                    ).toBeTruthy();
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
                    return element(by.css('input[name="first_name"]'))
                        .sendKeys(contact.firstName);
                })
                .then(function() {
                    return element(by.css('input[name="last_name"]'))
                        .sendKeys(contact.lastName);
                })
                .then(function() {
                    return element(by.css('input[name="email"]'))
                        .sendKeys(contact.email);
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

        it('can update a producer manyfold', function() {
            producersManagement.openProducersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
            expect(firstRowName.getText()).toEqual('John Deere');

            var updateProducer = function(producerName, contactEmail) {
                return firstRowName
                    .click()
                    .then(function() {
                        return element(by.css('input#name')).isDisplayed();
                    })
                    .then(function() {
                        return element(by.css('input#name')).clear();
                    })
                    .then(function() {
                        return element(by.css('input#name')).sendKeys(producerName);
                    })
                    .then(function() {
                        return element(by.css('input[name="email"]')).clear();
                    })
                    .then(function() {
                        return element(by.css('input[name="email"]'))
                            .sendKeys(contactEmail);
                    })
                    .then(function() {
                        return element(by.css('#save-edit-btn')).click();
                    })
                    .then(function() {
                        return assertToastMsg('success', 'producer saved.');
                    })
                    .then(function() {
                        var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
                        expect(firstRowName.getText()).toEqual(producerName);
                        return element.all(by.repeater('producer in producers')).count();
                    })
                    .then(function(count) {
                        return expect(count).toEqual(1);
                    });
            };

            updateProducer(producer.name, contact.email).then(function() {
                return updateProducer(producer.name + '1', 'sketch@up.com');
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
