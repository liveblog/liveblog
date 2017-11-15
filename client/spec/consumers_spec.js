'use strict';

var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    consumersManagement = require('./helpers/pages').consumersManagement;

var consumer = {
    name: 'Massey Fergusson',
    webhookUrl: 'https://www.masseyferguson.de/api/syndication/webhook'
};

var contact = {
    firstName: 'Jean',
    lastName: 'Pierre',
    email: 'jean.pierre@gmail.com'
};

var contact2 = {
    firstName: 'Paul',
    lastName: 'Sabatier',
    email: 'paul.sabatier@gmail.com'
};

const originalCount = 25;

describe('Consumers', function() {

    beforeEach(function(done) {
      browser.ignoreSynchronization = true;
      login()
        .then(() => browser.ignoreSynchronization = false)
        .then(done);
    });

    describe('list', function() {
        it('can open consumers managements and list the consumers', function() {
            consumersManagement.openConsumersManagement();
        });

        it('can switch to page 2', function() {
            consumersManagement.openConsumersManagement();

            element(by.css('button[ng-click="setPage(page + 1)"]'))
                .click()
                .then(() => element.all(by.repeater('consumer in consumers')).count())
                .then((count) => {
                    expect(count).toEqual(11);
                })
        });

        it('can show an error when some required field are empty', function() {
            consumersManagement.openConsumersManagement();

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
                    return element(by.css('#save-edit-btn')).isDisplayed();
                })
                .then(function() {
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(function() {
                    var fieldName = 'div[ng-show="consumerForm.attempted &&' +
                        ' consumerForm.name.$error.required"]';

                    return expect(
                        $(fieldName).isDisplayed()
                    ).toBeTruthy();
                })
                .then(function() {
                    var fieldName = 'div[ng-show="consumerForm.attempted &&' +
                        ' consumerForm.webhook_url.$error.required"]';

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

        it('can create a new consumer', function() {
            consumersManagement.openConsumersManagement();

            element(by.css('button.navbtn.sd-create-btn'))
                .click()
                .then(function() {
                    return element(by.css('input#name')).isDisplayed();
                })
                .then(function() {
                    return element(by.css('input#name')).sendKeys(consumer.name);
                })
                .then(function() {
                    return element(by.css('input#webhook-url')).sendKeys(consumer.webhookUrl);
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
                    //var el = element(by.css('#save-edit-btn'));
                    //browser.driver.wait(protractor.until.elementIsVisible(el));
                    //return el.click();
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(function() {
                    var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
                    expect(firstRowName.getText()).toEqual(consumer.name);
                    return element.all(by.repeater('consumer in consumers')).count();
                })
                .then(function(count) {
                    expect(count).toEqual(originalCount + 1);
                });
        });

        it('can update a consumer manyfold', function() {
            consumersManagement.openConsumersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
            expect(firstRowName.getText()).toEqual('John Deere');

            var updateConsumer = function(consumerName, contactEmail) {
                return firstRowName
                    .click()
                    .then(function() {
                        return element(by.css('input#name')).isDisplayed();
                    })
                    .then(function() {
                        return element(by.css('input#name')).clear();
                    })
                    .then(function() {
                        return element(by.css('input#name')).sendKeys(consumerName);
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
                        var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
                        var firstRowEmail = element(by.css('ul.table-body div.row-wrapper div[lb-first-contact] a'));

                        expect(firstRowName.getText()).toEqual(consumerName);
                        expect(firstRowEmail.getText()).toEqual(contactEmail);

                        return element.all(by.repeater('consumer in consumers')).count();
                    })
                    .then(function(count) {
                        return expect(count).toEqual(originalCount);
                    });
            };

            updateConsumer(consumer.name, contact.email).then(function() {
                return updateConsumer(consumer.name + '1', contact.email);
            });
        });

        it('can delete a consumer', function() {
           consumersManagement.openConsumersManagement();
            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
            expect(firstRowName.getText()).toEqual('John Deere');

            var elemToHover = element(by.css('ul.table-body div.row-wrapper'));

            browser.actions().mouseMove(elemToHover).perform()
                .then(function() {
                    return element(by.css('a.delete-consumer'))
                        .click();
                })
                .then(function() {
                    return element(by.css('button[ng-click="ok()"]'))
                        .click();
                })
                .then(function() {
                    return element.all(by.repeater('consumer in consumers')).count();
                })
                .then(function(count) {
                    expect(count).toEqual(originalCount - 1);
                });
        });
    });

    describe('Contacts', function() {
        it('can add a contact to an existing entry', function() {
            consumersManagement.openConsumersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
            expect(firstRowName.getText()).toEqual('John Deere');

            firstRowName
                .click()
                .then(function() {
                    return element(by.css('button[ng-click="addContact()"]')).isDisplayed();
                })
                .then(function() {
                    return element(by.css('button[ng-click="addContact()"]')).click();
                })
                .then(function() {
                    return element.all(by.repeater('contact in contacts')).get(1).isDisplayed();
                })
                .then(function() {
                    return element
                        .all(by.repeater('contact in contacts'))
                        .get(1)
                        .element(by.css('input[name="first_name"]'))
                        .sendKeys(contact2.firstName);
                })
                .then(function() {
                    return element
                        .all(by.repeater('contact in contacts'))
                        .get(1)
                        .element(by.css('input[name="last_name"]'))
                        .sendKeys(contact2.lastName);
                })
                .then(function() {
                    return element
                        .all(by.repeater('contact in contacts'))
                        .get(1)
                        .element(by.css('input[name="email"]'))
                        .sendKeys(contact2.email);
                })
                .then(function() {
                    return element(by.css('#save-edit-btn')).click();
                });
         });
    });
});
