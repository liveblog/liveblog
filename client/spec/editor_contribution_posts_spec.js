var login = require('../app/scripts/bower_components/superdesk/client/spec/helpers/utils.js').login,
    blogs = require('./helpers/pages').blogs;

describe('Contributions Posts', function() {
    'use strict';

    beforeEach(function(done) {login().then(done);});

    it('can open contributions panel from url', function() {
        var contributions = blogs.openBlog(0).contributions;
        browser.getCurrentUrl().then(function(url) {
            browser.get(url + '?panel=contributions').then(function() {
                expect(contributions.column.isPresent()).toBe(true);
            });
        });
    });

    it('can create contributions and respect the order', function() {
        var blog = blogs.openBlog(0);
        var contrib1 = blog.editor.createContribution();
        var contrib2 = blog.editor.createContribution();
        // check
        blog.openContributions()
            .expectPost(0, contrib2.quote)
            .expectPost(1, contrib1.quote);
    });

    it('can open a contributions in the editor and publish it', function() {
        var blog = blogs.openBlog(0);
        var contrib = blog.editor.createContribution();
        var contributions = blog.openContributions();
        var draft = contributions.get(0);
        contributions.edit(draft);
        var editor = blog.openEditor();
        expect(editor.textElement.getText()).toEqual(contrib.body);
        editor.publish().then(function() {
            expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
            blog.openContributions();
            expect(contributions.all().count()).toBe(0);
        });
    });

    it('can open a contributions in the editor and update it', function() {
        var blog = blogs.openBlog(0);
        var contrib = blog.editor.createContribution();
        var contributions = blog.openContributions();
        var draft = contributions.get(0);
        contributions.edit(draft);
        var editor = blog.openEditor();
        expect(editor.textElement.getText()).toEqual(contrib.body);
        editor.quoteElement.clear().sendKeys('update');
        editor.saveContribution();
        blog.openContributions().expectPost(0, 'update');
        expect(contributions.all().count()).toBe(1);
    });

    it('can\'t open a contributions from other in the editor', function() {
        var blog = blogs.openBlog(0);
        var contrib = blog.editor.createContribution();
        browser.driver.manage().window().setSize(1280, 1024);
        browser.get('/');
        element(by.css('button.current-user')).click();
        // wait for sidebar animation to finish
        browser.wait(function() {
            return element(by.buttonText('SIGN OUT')).isDisplayed();
        }, 1000);
        element(by.buttonText('SIGN OUT')).click();
        browser.wait(function() {
            return browser.driver.isElementPresent(by.id('login-btn'));
        }, 5000);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
        browser.sleep(2000); // it reloads page
        login('contributor', 'contributor').then(function() {
            var contributions = blogs.openBlog(0).openContributions();
            browser.wait(function() {
                return element(contributions.byPosts).isPresent();
            }, 5000);
            contributions.expectPost(0, contrib.quote);
            expect(contributions.editButtonIsPresent(contributions.get(0))).toBe(false);
        });
    });

    it('filter contributions by member', function() {
        var contributions = blogs.openBlog(3).openContributions();
        contributions.expectPost(0, 'admin\'s contribution');
        contributions.expectPost(1, 'editor\'s contribution');
        contributions.filterByMember('editor').then(function() {
            contributions.expectPost(0, 'editor\'s contribution');
        });
    });
});
