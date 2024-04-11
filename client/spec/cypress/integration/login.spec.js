describe('login', () => {
    beforeEach(() => {
        cy.visit('/'); 
    });

    it('form renders modal on load', () => {
        cy.get('#login-btn').should('be.visible');
    });
    
    it('user can log in', () => {
        cy.login('admin', 'admin'); 
        cy.waitForSuperdesk();
        cy.url().should('include', '/#/liveblog');
        cy.get('button.current-user').click();
        cy.get('.user-info .displayname').should('have.text', 'admin');
    });

    it('user can log out', () => {
        cy.login('admin', 'admin');
        cy.waitForSuperdesk(); 
        cy.get('button.current-user').click();
        cy.get('button:contains("SIGN OUT")', { timeout: 200 }).should('be.visible').click();
        cy.wait(2000);
        cy.get('#login-btn').should('be.visible');
    });
    

    it('unknown user can\'t log in', () => {
        cy.login('foo', 'bar');
        cy.get('#login-btn').should('be.visible');
        cy.url().should('not.include', '/#/liveblog');
        cy.get('p.error').should('be.visible');
    });
});
