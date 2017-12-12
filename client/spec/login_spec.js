var Login = require('./../node_modules/superdesk-core/spec/helpers/pages').login;
var waitForSuperdesk = require('./../node_modules/superdesk-core/spec/helpers/utils').waitForSuperdesk;

describe('login', () => {
    var modal;

    beforeEach(() => {
        browser.ignoreSynchronization = true;
        modal = new Login();
    });

    it('form renders modal on load', () => {
        expect(modal.btn.isDisplayed()).toBe(true);
        browser.ignoreSynchronization = false;
    });

    it('user can log in', () => {
        modal.login('admin', 'admin');

        waitForSuperdesk().then(() => {
            browser.ignoreSynchronization = false;
            expect(modal.btn.isDisplayed()).toBe(false);
            expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/liveblog');
            element(by.css('button.current-user')).click();
            expect(
                element(by.css('.user-info .displayname'))
                    .waitReady()
                    .then((elem) => elem.getText())
            ).toBe('admin');
        });
    });

    it('user can log out', () => {
        modal.login('admin', 'admin');

        waitForSuperdesk().then(() => {
            browser.ignoreSynchronization = false;
            element(by.css('button.current-user')).click();

            // wait for sidebar animation to finish
            browser.wait(() => element(by.buttonText('SIGN OUT')).isDisplayed(), 200);

            element(by.buttonText('SIGN OUT')).click();

            browser.wait(() => element(by.id('login-btn')), 5000);
        });
    });

    it('unknown user can\'t log in', () => {
        modal.login('foo', 'bar');
        expect(modal.btn.isDisplayed()).toBe(true);
        expect(browser.getCurrentUrl()).not.toBe(browser.baseUrl + '/#/liveblog');
        expect(modal.error.isDisplayed()).toBe(true);
    });
});

