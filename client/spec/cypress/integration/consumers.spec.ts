// / <reference types="cypress" />
import { consumersPage } from '../support/pages/consumers';
import { Consumer, Contact } from '../support/types';

describe('Consumers Management', () => {
    const consumer: Consumer = {
        name: 'Massey Fergusson',
        webhookUrl: 'https://www.masseyferguson.de/api/syndication/webhook',
    };

    const contact: Contact = {
        firstName: 'Jean',
        lastName: 'Pierre',
        email: 'jean.pierre@gmail.com',
    };

    const contact2: Contact = {
        firstName: 'Paul',
        lastName: 'Sabatier',
        email: 'paul.sabatier@gmail.com',
    };

    beforeEach(() => {
        cy.visit('/');
        cy.login('admin', 'admin');
        cy.waitForSuperdesk();
    });

    describe('List View', () => {
        it('should display consumers list', () => {
            consumersPage.openConsumersManagement()
                .expectConsumerCount(25);
        });

        it('should handle pagination', () => {
            consumersPage.openConsumersManagement();
            cy.get('button[ng-click="setPage(page + 1)"]').click();
            consumersPage.expectConsumerCount(11);
        });
    });

    // describe('Form Validation', () => {
    //     it('should show validation errors for required fields', () => {
    //         consumersPage.openConsumersManagement();
    //         cy.get('button.navbtn.sd-create-btn').click();
    //         cy.get('input[name="first_name"]').type(contact.firstName);
    //         cy.get('#save-edit-btn').click();
    //         consumersPage.expectValidationErrors();
    //     });
    // });

    // describe('Consumer Management', () => {
    //     it('should create a new consumer', () => {
    //         consumersPage.openConsumersManagement()
    //             .createConsumer(consumer, contact)
    //             .expectFirstConsumerName(consumer.name)
    //             .expectConsumerCount(26);
    //     });

    //     it('should update an existing consumer', () => {
    //         const updatedName = consumer.name + '1';

    //         consumersPage.openConsumersManagement()
    //             .updateConsumer(updatedName, contact.email)
    //             .expectFirstConsumerName(updatedName)
    //             .expectFirstConsumerEmail(contact.email);
    //     });

    //     it('should delete a consumer', () => {
    //         consumersPage.openConsumersManagement()
    //             .deleteConsumer()
    //             .expectConsumerCount(24);
    //     });
    // });

    // describe('Contact Management', () => {
    //     it('should add a contact to an existing consumer', () => {
    //         consumersPage.openConsumersManagement()
    //             .addContact(contact2);
    //     });
    // });
});