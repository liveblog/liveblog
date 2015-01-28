var Login = require('./helpers/pages').login;

var ptor = browser;

describe('login', function() {
    'use strict';

    var modal;

    beforeEach(function() {
        browser.get('/');
        modal = new Login();
    });

    it('form renders modal on load', function() {
        expect(modal.btn.isPresent()).toBe(true);
    });

    it('user can log in', function() {
        modal.login('admin', 'admin');
        expect(browser.getCurrentUrl()).toBe(ptor.baseUrl + '/#/workspace');
        element(by.css('button.current-user')).click();
        expect(element(by.css('.user-info .displayname')).getText()).toBe('admin');
    });

    it('user can log out', function() {
        modal.login('admin', 'admin');
        element(by.css('button.current-user')).click();
        element(by.buttonText('SIGN OUT')).click();
        browser.sleep(2000); // it reloads page
        browser.waitForAngular();
        expect(modal.btn.isPresent()).toBe(true);
        expect(modal.username.isPresent()).toBe(true);
        expect(modal.username.getAttribute('value')).toBe('');
    });

    it('unknown user can\'t log in', function() {
        modal.login('foo', 'bar');
        expect(modal.btn.isPresent()).toBe(true);
        expect(browser.getCurrentUrl()).not.toBe(ptor.baseUrl + '/#/workspace');
        expect(modal.error.isPresent()).toBe(true);
    });

});
