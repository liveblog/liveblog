const Login = require('./../node_modules/superdesk-core/spec/helpers/pages').login;
const waitForSuperdesk = require('./../node_modules/superdesk-core/spec/helpers/utils').waitForSuperdesk;

describe('login', () => {
    let modal;

    beforeEach(() => {
        modal = new Login();
    });

    it('form renders modal on load', () => {
        expect(modal.btn.isDisplayed()).toBe(true);
    });

    it('user can log in', () => {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        expect(modal.btn.isDisplayed()).toBe(false);
        expect(browser.getCurrentUrl()).toBe(browser.baseUrl + '/#/liveblog');
        element(by.css('button.current-user')).click();
        expect(
            element(by.css('.user-info .displayname'))
                .waitReady()
                .then((elem) => elem.getText())
        ).toBe('admin');
    });

    it('user can log out', () => {
        modal.login('admin', 'admin');
        waitForSuperdesk();
        element(by.css('button.current-user')).click();
        // wait for sidebar animation to finish
        browser.wait(() => element(by.buttonText('SIGN OUT')).isDisplayed(), 200);
        element(by.buttonText('SIGN OUT')).click();
        browser.sleep(2000);
        expect(modal.btn.isDisplayed()).toBe(true);
    });

    it('unknown user can\'t log in', () => {
        modal.login('foo', 'bar');
        expect(modal.btn.isDisplayed()).toBe(true);
        expect(browser.getCurrentUrl()).not.toBe(browser.baseUrl + '/#/liveblog');
        expect(modal.error.isDisplayed()).toBe(true);
    });
});