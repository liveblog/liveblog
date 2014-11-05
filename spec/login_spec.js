
var gotoUri = require('./helpers/liveblog_frontend').gotoUri;
var Login = require('./helpers/pages').login;

var pp = protractor.getInstance().params;

describe('login', function() {
    'use strict';

    var modal;

    beforeEach(function() {
        gotoUri('/#/');
        browser.executeScript('sessionStorage.clear();localStorage.clear();');
        gotoUri('/#/');
        modal = new Login();
        protractor.getInstance().waitForAngular();
    });

    it('renders modal on load', function() {
        expect(modal.btn).toBeDisplayed();
    });

    it('can login', function() {
        modal.login('admin', 'admin');
        expect(modal.btn).not.toBeDisplayed();
        expect(browser.getCurrentUrl()).toBe(pp.baseUrl + '/#/workspace');
        expect(element(by.binding('display_name')).getText()).toBe('John Doe');
    });

    it('can logout', function() {
        modal.login('admin', 'admin');
        element(by.binding('display_name')).click();
        element(by.buttonText('SIGN OUT')).click();

        protractor.getInstance().sleep(2000); // it reloads page
        protractor.getInstance().waitForAngular();

        expect(modal.btn).toBeDisplayed();
        expect(modal.username).toBeDisplayed();
        expect(modal.username.getAttribute('value')).toBe('');
    });
});
