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

describe('Consumers', () => {

    beforeEach((done) => {
        login()
            .then(done);
    });

    describe('list', () => {
        it('can open consumers managements and list the consumers', () => {
            consumersManagement.openConsumersManagement();
        });

        it('can switch to page 2', () => {
            consumersManagement.openConsumersManagement();

            element(by.css('button[ng-click="setPage(page + 1)"]'))
                .click()
                .then(() => element.all(by.repeater('consumer in consumers')).count())
                .then((count) => {
                    expect(count).toEqual(11);
                });
        });

        it('can show an error when some required field is empty', () => {
            consumersManagement.openConsumersManagement();

            element(by.css('button.navbtn.sd-create-btn'))
                .click()
                .then(() => {
                    return element(by.css('input#name')).isDisplayed();
                })
                .then(() => {
                    return element(by.css('input[name="first_name"]'))
                        .sendKeys(contact.firstName);
                })
                .then(() => {
                    return element(by.css('#save-edit-btn')).isDisplayed();
                })
                .then(() => {
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(() => {
                    var fieldName = 'div[ng-show="consumerForm.attempted &&' +
                        ' consumerForm.name.$error.required"]';

                    return expect(
                        $(fieldName).isDisplayed()
                    ).toBeTruthy();
                })
                .then(() => {
                    var fieldName = 'div[ng-show="consumerForm.attempted &&' +
                        ' consumerForm.webhook_url.$error.required"]';

                    return expect(
                        $(fieldName).isDisplayed()
                    ).toBeTruthy();
                })
                .then(() => {
                    return expect(
                        $('div[ng-show="attempted && contactForm.first_name.$error.required"]')
                            .isDisplayed()
                    ).toBeFalsy();
                })
                .then(() => {
                    return expect(
                        $('div[ng-show="attempted && contactForm.last_name.$error.required"]')
                            .isDisplayed()
                    ).toBeTruthy();
                })
                .then(() => {
                    return expect(
                        $('div[ng-show="attempted && contactForm.email.$error.required"]')
                            .isDisplayed()
                    ).toBeTruthy();
                });
        });

        it('can create a new consumer', () => {
            consumersManagement.openConsumersManagement();

            element(by.css('button.navbtn.sd-create-btn'))
                .click()
                .then(() => {
                    return element(by.css('input#name')).isDisplayed();
                })
                .then(() => {
                    return element(by.css('input#name')).sendKeys(consumer.name);
                })
                .then(() => {
                    return element(by.css('input#webhook-url')).sendKeys(consumer.webhookUrl);
                })
                .then(() => {
                    return element(by.css('input[name="first_name"]'))
                        .sendKeys(contact.firstName);
                })
                .then(() => {
                    return element(by.css('input[name="last_name"]'))
                        .sendKeys(contact.lastName);
                })
                .then(() => {
                    return element(by.css('input[name="email"]'))
                        .sendKeys(contact.email);
                })
                .then(() => {
                    // var el = element(by.css('#save-edit-btn'));
                    // browser.driver.wait(protractor.until.elementIsVisible(el));
                    // return el.click();
                    return element(by.css('#save-edit-btn')).click();
                })
                .then(() => {
                    var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));

                    expect(firstRowName.getText()).toEqual(consumer.name);
                    return element.all(by.repeater('consumer in consumers')).count();
                })
                .then((count) => {
                    expect(count).toEqual(originalCount + 1);
                });
        });

        it('can update a consumer manyfold', () => {
            consumersManagement.openConsumersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));

            expect(firstRowName.getText()).toEqual('John Deere');

            var updateConsumer = function(consumerName, contactEmail) {
                return firstRowName
                    .click()
                    .then(() => {
                        return element(by.css('input#name')).isDisplayed();
                    })
                    .then(() => {
                        return element(by.css('input#name')).clear();
                    })
                    .then(() => {
                        return element(by.css('input#name')).sendKeys(consumerName);
                    })
                    .then(() => {
                        return element(by.css('input[name="email"]')).clear();
                    })
                    .then(() => {
                        return element(by.css('input[name="email"]'))
                            .sendKeys(contactEmail);
                    })
                    .then(() => {
                        return element(by.css('#save-edit-btn')).click();
                    })
                    .then(() => {
                        var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));
                        var firstRowEmail = element(by.css('ul.table-body div.row-wrapper div[lb-first-contact] a'));

                        expect(firstRowName.getText()).toEqual(consumerName);
                        expect(firstRowEmail.getText()).toEqual(contactEmail);

                        return element.all(by.repeater('consumer in consumers')).count();
                    })
                    .then((count) => {
                        return expect(count).toEqual(originalCount);
                    });
            };

            updateConsumer(consumer.name, contact.email).then(() => {
                return updateConsumer(consumer.name + '1', contact.email);
            });
        });

        it('can delete a consumer', () => {
            consumersManagement.openConsumersManagement();
            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));

            expect(firstRowName.getText()).toEqual('John Deere');

            var elemToHover = element(by.css('ul.table-body div.row-wrapper'));

            browser.actions().mouseMove(elemToHover).perform()
                .then(() => {
                    return element(by.css('a.delete-consumer'))
                        .click();
                })
                .then(() => {
                    return element(by.css('button[ng-click="ok()"]'))
                        .click();
                })
                .then(() => {
                    return element.all(by.repeater('consumer in consumers')).count();
                })
                .then((count) => {
                    expect(count).toEqual(originalCount - 1);
                });
        });
    });

    describe('Contacts', () => {
        it('can add a contact to an existing entry', () => {
            consumersManagement.openConsumersManagement();

            var firstRowName = element(by.css('ul.table-body div.row-wrapper div.name'));

            expect(firstRowName.getText()).toEqual('John Deere');

            firstRowName
                .click()
                .then(() => {
                    return element(by.css('button[ng-click="addContact()"]')).isDisplayed();
                })
                .then(() => {
                    return element(by.css('button[ng-click="addContact()"]')).click();
                })
                .then(() => {
                    return element.all(by.repeater('contact in contacts')).get(1).isDisplayed();
                })
                .then(() => {
                    return element
                        .all(by.repeater('contact in contacts'))
                        .get(1)
                        .element(by.css('input[name="first_name"]'))
                        .sendKeys(contact2.firstName);
                })
                .then(() => {
                    return element
                        .all(by.repeater('contact in contacts'))
                        .get(1)
                        .element(by.css('input[name="last_name"]'))
                        .sendKeys(contact2.lastName);
                })
                .then(() => {
                    return element
                        .all(by.repeater('contact in contacts'))
                        .get(1)
                        .element(by.css('input[name="email"]'))
                        .sendKeys(contact2.email);
                })
                .then(() => {
                    return element(by.css('#save-edit-btn')).click();
                });
        });
    });
});
