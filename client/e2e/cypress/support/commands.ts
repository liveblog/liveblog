/// <reference types="cypress" />

declare global {
    namespace Cypress {
        interface Chainable {
            waitForSuperdesk(): Chainable<void>;
            setupFixtures(): Chainable<void>;
            login(username: string, password: string): Chainable<void>;
            getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
        }
    }
}

Cypress.Commands.add('waitForSuperdesk', () => {
    cy.window().should('have.property', 'superdeskIsReady', true);
});

Cypress.Commands.add('setupFixtures', () => {
    cy.request({
        method: 'POST',
        url: 'http://127.0.0.1:5001/api/prepopulate',
        body: { profile: 'test' },
        timeout: 40000
    });
});

// This runs once before all tests
before(() => {
    cy.setupFixtures();
});

Cypress.Commands.add('login', (username, password) => {
    cy.get('[ng-model="username"]').type(username);
    cy.get('[ng-model="password"]').type(password);
    cy.get('#login-btn').click();
});

Cypress.Commands.add('getByTestId', (testId) => {
    return cy.get(`[data-testid="${testId}"]`);
});