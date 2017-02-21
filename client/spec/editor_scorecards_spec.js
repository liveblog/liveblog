var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    blogs = require('./helpers/pages').blogs;

describe('Scorecards Posts', function() {
    'use strict';

    beforeEach(function(done) {
        browser.ignoreSynchronization = true;
        login('editor', 'editor')
            .then(() => browser.ignoreSynchronization = false)
            .then(done);
    });

    it('can publish socrecard and edit it', function() {
        var blog = blogs.openBlog(0);
        var editor = blog.openFreetypesEditor(2);

        editor.publishScorecard().then(function(data) {

            browser.waitForAngular();
            browser.refresh();
            //we should have the post in the timeline
            expect(blogs.blog.timeline.get(0).isPresent()).toBe(true);
            blogs.blog.timeline.edit(0);

            //check that edit is loading the initial values
            //usign getAttribute('value') instead of getText() because of known webdriver quirk
            expect(editor.homeName.getAttribute('value')).toEqual(data.homeName);
            expect(editor.homeScore.getAttribute('value')).toEqual(data.homeScore);
            expect(editor.awayName.getAttribute('value')).toEqual(data.awayName);
            expect(editor.awayScore.getAttribute('value')).toEqual(data.awayScore);
            expect(editor.player1Name.getAttribute('value')).toEqual(data.player1Name);
            expect(editor.player1Time.getAttribute('value')).toEqual(data.player1Time);

            //now do an actual edit like adding another scoarer
            element(by.css('[ng-click="ftca.add()"]')).click();
            editor.player2Name.sendKeys(data.player2Name);
            editor.player2Time.sendKeys(data.player2Time);

            editor.publish();
            browser.waitForAngular();
            browser.refresh();

            //check for the edited content
            blogs.blog.timeline.edit(0);
            expect(editor.player2Name.getAttribute('value')).toEqual(data.player2Name);
            expect(editor.player2Time.getAttribute('value')).toEqual(data.player2Time);

            //now try to reset
            editor.resetEditor(true);
            expect(editor.homeName.getAttribute('value')).toEqual('');
            expect(editor.homeScore.getAttribute('value')).toEqual('');
            expect(editor.awayName.getAttribute('value')).toEqual('');
            expect(editor.awayScore.getAttribute('value')).toEqual('');
        });
    });
});
