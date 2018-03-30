var login = require('./../node_modules/superdesk-core/spec/helpers/utils').login,
    randomString = require('./helpers/pages').randomString,
    blogs = require('./helpers/pages').blogs;

describe('Blog settings', () => {
    beforeEach((done) => {
        login('editor', 'editor')
            .then(done);
    });


    it('should modify title and description for blog', () => {
        var blog = blogs.cloneBlog(0);

        blog.title = randomString();
        blog.description = randomString();

        blogs.openBlog(0).openSettings();
        blogs.blog.settings.title.clear().sendKeys(blog.title);
        blogs.blog.settings.description.clear().sendKeys(blog.description);
        blogs.blog.settings.done()
            .openList()
            .then(() => {
                blogs.expectBlog(blog, 0);
            });
    });

    it('should change the image for blog', () => {
        var path = require('path'),
            blog = blogs.cloneBlog(0);

        blog.picture_url = './upload/-o-jpg-1600-900.jpg';
        blogs.openBlog(0).openSettings()
            .then((settingsPage) => settingsPage.openUploadModal())
            .then(() => {
                blogs.blog.settings.file.sendKeys(path.resolve(__dirname, blog.picture_url));
                blogs.blog.settings
                    .upload()
                    .done()
                    .openList()
                    .then(() => {
                        blogs.expectBlog(blog);
                    });
            });

    });

    it('should remove the image from blog', () => {
        var blog = blogs.cloneBlog(0);

        delete blog.picture_url;

        blogs.openBlog(0).openSettings()
            .then((settingsPage) => {
                return settingsPage.removeImage()
                    .waitForModal()
                    .okModal()
                    .waitDone()
                    .done()
                    .openList()
                    .then(() => {
                        blogs.expectBlog(blog);
                    });
            });
    });

    it('shows original creator full name and username', () => {
        blogs.openBlog(0).openSettings()
            .then((settingsPage) => settingsPage.openTeam())
            .then(() => {
                blogs.blog.settings.displayName.getText().then((text) => {
                    expect(text).toEqual('Victor the Editor');
                });
                blogs.blog.settings.userName.getText().then((text) => {
                    expect(text).toEqual('editor');
                });
            });
    });

    it('ads a team member from blog settings', () => {
        blogs.openBlog(0)
            .openSettings()
            .then((settingsPage) =>
                settingsPage
                    .openTeam()
                    .then(settingsPage.editTeam)
            )
            .then(() => {
                blogs.blog.settings.team
                    .searchUser('g')
                    .waitChooseUser()
                    .changeToUser();
                blogs.blog.settings
                    .doneTeamEdit()
                    .done()
                    .openSettings()
                    .then((settingsPage) => settingsPage.openTeam())
                    .then(() => {
                        expect(blogs.blog.settings.contributors.count()).toBe(1);
                    });
            });
    });

    it('should archive a blog', () => {
        var blog = blogs.cloneBlog(0);

        blogs.openBlog(0).openSettings()
            .then((settingsPage) => {
                settingsPage
                    .switchStatus()
                    .done()
                    .openList()
                    .then(() => {
                        blogs.selectState('archived')
                            .expectBlog(blog);
                    });
            });
    });

    it('should activate a blog', () => {
        var blog = blogs.cloneBlog(0, 'archived');

        blogs.selectState('archived')
            .openBlog(0).openSettings().then((settingsPage) => {
                settingsPage.switchStatus()
                    .done()
                    .openList()
                    .then(() => {
                        blogs.selectState('active')
                            .expectBlog(blog);
                    });
            });
    });

    it('changes blog ownership & admin can open settings for any blog & contributor can\'t access blog settings even if owner',
        () => {
            blogs.openBlog(0).openSettings()
                .then((settingsPage) => {
                    return settingsPage.openTeam().then(() => {
                        settingsPage.changeOwner()
                            .changeToOwner()
                            .selectOwner()
                            .done();
                    });
                })
                .then(() => {
                    browser.get('/');
                    browser.sleep(2000); // it reloads page
                    var blog = blogs.openBlog(0);

                    blog.openSettings()
                        .then((settingsPage) => {
                            return settingsPage.openTeam()
                                .then(() => {
                                    blogs.blog.settings.userName.getText()
                                        .then((text) => {
                                            expect(text).toEqual('contributor');
                                        });
                                });
                        })
                        .then(() => {
                            browser.get('/');
                            element(by.css('button.current-user')).click();
                            browser.sleep(1000); // it reloads page
                            element(by.buttonText('SIGN OUT')).click();
                            browser.sleep(2000); // it reloads page
                            browser.sleep(2000); // it reloads page

                            login('contributor', 'contributor').then(() => {
                                expect(element(by.css('.settings-link')).isPresent()).toBeFalsy();
                            });
                        });
                });
        });

    it('remove a blog', () => {
        blogs.expectCount(4);
        blogs.openBlog(0)
            .openSettings()
            .then((settingsPage) => {
                settingsPage.removeBlog();

                browser.get('/');
                browser.sleep(2000); // it reloads page
                blogs.expectCount(3);
            });
    });

    it('should do CRUD operations on output channels', () => {
        blogs.openBlog(0)
            .openSettings()
            .then((sp) => {
                sp.openOutputs();
                // no outputs by default
                expect(sp.getOutputs().count()).toBe(0);

                sp.openOutputDialog();

                sp.editOutput().then((outputData) => {
                    var outputTitle = element(by.css('[ng-model="self.output.name"]'));

                    // we should now have one output
                    expect(sp.getOutputs().count()).toBe(1);

                    // open 1st output and check contents
                    sp.getOutputs()
                        .get(0)
                        .click();
                    element(by.css('[ng-click="settings.openOutputDialog(output);"]')).click();

                    expect(outputTitle.getAttribute('value')).toEqual(outputData.title);

                    // edit output
                    var newData = sp.createOutputData();

                    outputTitle.sendKeys(newData.title);


                    sp.saveOutput().then(() => {
                        // check the new contents to match
                        var newTitle = outputData.title + newData.title;

                        expect(element(by.id('output-name')).getText()).toEqual(newTitle);
                    });

                    // remove first output
                    sp.removeOutput(0);

                    // expect no outputs available
                    expect(sp.getOutputs().count()).toBe(0);
                });
            });
    });
});
