/// <reference types="cypress" />
import { Consumer, Contact } from '../types';

class ConsumersPage {
    // Selectors
    private selectors = {
        menuToggle: '[ng-click="toggleMenu()"]',
        syndicationLink: '[href="#/syndication/"][title]',
        consumersTab: '[data-testid="syndication-tab-consumers"]',
        createButton: 'button.navbtn.sd-create-btn',
        nameInput: 'input#name',
        webhookUrlInput: 'input#webhook-url',
        firstNameInput: 'input[name="first_name"]',
        lastNameInput: 'input[name="last_name"]',
        emailInput: 'input[name="email"]',
        saveButton: '#save-edit-btn',
        consumerRows: 'ul.table-body div.row-wrapper',
        consumerName: 'div.name',
        consumerEmail: 'div[lb-first-contact] a',
        deleteButton: 'a.delete-consumer',
        confirmDeleteButton: 'button[ng-click="ok()"]',
        addContactButton: 'button[ng-click="addContact()"]',
        paginationNext: 'button[ng-click="setPage(page + 1)"]',
    };

    // Navigation
    openConsumersManagement() {
        cy.get(this.selectors.menuToggle).click();
        cy.get(this.selectors.syndicationLink).click({force: true});
        cy.get(this.selectors.consumersTab).click();
        return this;
    }

    // Actions
    createConsumer(consumer: Consumer, contact: Contact) {
        cy.get(this.selectors.createButton).click();
        cy.get(this.selectors.nameInput).type(consumer.name);
        cy.get(this.selectors.webhookUrlInput).type(consumer.webhookUrl);
        cy.get(this.selectors.firstNameInput).type(contact.firstName);
        cy.get(this.selectors.lastNameInput).type(contact.lastName);
        cy.get(this.selectors.emailInput).type(contact.email);
        cy.get(this.selectors.saveButton).click();
        return this;
    }

    updateConsumer(name: string, email: string) {
        cy.get(this.selectors.consumerRows).first()
            .click();
        cy.get(this.selectors.nameInput).clear()
            .type(name);
        cy.get(this.selectors.emailInput).clear()
            .type(email);
        cy.get(this.selectors.saveButton).click();
        return this;
    }

    deleteConsumer() {
        cy.get(this.selectors.consumerRows).first()
            .trigger('mouseover')
            .find(this.selectors.deleteButton)
            .click();
        cy.get(this.selectors.confirmDeleteButton).click();
        return this;
    }

    addContact(contact: Contact) {
        cy.get(this.selectors.consumerRows).first()
            .click();
        cy.get(this.selectors.addContactButton).click();
        cy.get('div[ng-repeat="contact in contacts"]').last()
            .within(() => {
                cy.get(this.selectors.firstNameInput).type(contact.firstName);
                cy.get(this.selectors.lastNameInput).type(contact.lastName);
                cy.get(this.selectors.emailInput).type(contact.email);
            });
        cy.get(this.selectors.saveButton).click();
        return this;
    }

    // Assertions
    expectConsumerCount(count: number) {
        cy.get(this.selectors.consumerRows).should('have.length', count);
        return this;
    }

    expectFirstConsumerName(name: string) {
        cy.get(this.selectors.consumerRows).first()
            .find(this.selectors.consumerName)
            .should('have.text', name);
        return this;
    }

    expectFirstConsumerEmail(email: string) {
        cy.get(this.selectors.consumerRows).first()
            .find(this.selectors.consumerEmail)
            .should('have.text', email);
        return this;
    }

    expectValidationErrors() {
        cy.get('div[ng-show="consumerForm.attempted && consumerForm.name.$error.required"]')
            .should('be.visible');
        cy.get('div[ng-show="consumerForm.attempted && consumerForm.webhook_url.$error.required"]')
            .should('be.visible');
        cy.get('div[ng-show="attempted && contactForm.last_name.$error.required"]')
            .should('be.visible');
        cy.get('div[ng-show="attempted && contactForm.email.$error.required"]')
            .should('be.visible');
        return this;
    }
}

export const consumersPage = new ConsumersPage();