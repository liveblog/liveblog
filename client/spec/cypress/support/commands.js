Cypress.Commands.add('waitForSuperdesk', () => {
    cy.window().should('have.property', 'superdeskIsReady', true);
});

Cypress.Commands.add('login', (username, password) => {
    cy.get('[ng-model="username"]').type(username);
    cy.get('[ng-model="password"]').type(password);
    cy.get('#login-btn').click();
});
