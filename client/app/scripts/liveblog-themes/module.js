import listTpl from 'scripts/liveblog-themes/views/list.ng1';

(function() {
    LiveblogThemesController.$inject = [
        'lodash',
        '$http',
        '$location',
        '$sce',
        '$window',
        'api',
        'blogService',
        'config',
        'gettext',
        'modal',
        'notify',
        'session',
        'upload',
        'privileges',
        'featuresService',
    ];
    function LiveblogThemesController(
        _,
        $http,
        $location,
        $sce,
        $window,
        api,
        blogService,
        config,
        gettext,
        modal,
        notify,
        session,
        upload,
        privileges,
        featuresService
    ) {
        const self = this;
        /**
         * Return a collection that represent the hierachy of the themes
         * @param {array} themes
         * @returns {object} hierachical collection
         */

        function getHierachyFromThemesCollection(themes) {
            const todo = [];
            const themesHierachy = {};

            function getParentNode(name, collectionParam) {
                const collection = collectionParam || themesHierachy;
                let ret;

                Object.keys(collection).forEach((key) => {
                    if (key === name) {
                        ret = collection[key];
                    }
                    if (angular.isObject(collection[key])) {
                        const res = getParentNode(name, collection[key]);

                        if (angular.isDefined(res)) {
                            ret = res;
                        }
                    }
                });
                return ret;
            }
            function addToHierarchy(name, extend) {
                if (angular.isDefined(extend)) {
                    const parentNode = getParentNode(extend);
                    const index = _.findIndex(todo, (a) => a[0] === name);

                    if (angular.isDefined(parentNode)) {
                        if (index > -1) {
                            todo.splice(index, 1);
                        }
                        parentNode[name] = {};
                    } else if (index === -1) {
                        todo.push([name, extend]);
                    }
                } else if (!angular.isDefined(themesHierachy[name])) {
                    themesHierachy[name] = {};
                }
            }
            themes.forEach((theme) => {
                addToHierarchy(theme.name, theme.extends);
            });
            let maxLoops = todo.length * todo.length;

            while (todo.length > 0 && maxLoops > 0) {
                for (let i = 0; i < todo.length; i++) {
                    addToHierarchy(todo[i][0], todo[i][1]);
                }
                maxLoops--;
            }
            return themesHierachy;
        }
        // parse the theme and create or fix properties.
        function parseTheme(theme) {
            const authorRX = /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm;
            let authorArray;
            // If the author is a string then use the format:
            // Name <Email> (Url)

            if (angular.isString(theme.author)) {
                authorArray = authorRX.exec(theme.author);

                if (authorArray) {
                    theme.author = {
                        name: authorArray[1],
                        email: authorArray[2],
                        url: authorArray[3],
                    };
                }
            }
        }
        function loadThemes() {
            // load only global preference for themes.
            api.global_preferences.query({where: {key: 'theme'}}).then((globalPreferences) => {
                self.globalTheme = _.find(globalPreferences._items, (item) => item.key === 'theme');
            });
            // load all the themes.
            // TODO: Pagination
            return api.themes.query().then((data) => {
                const themes = data._items;

                self.themeNames = [];
                for (var i = 0; i < themes.length; i++) {
                    if (themes[i].name !== 'angular') {
                        self.themeNames.push({label: themes[i].label, name: themes[i].name});
                    }
                }

                themes.forEach((theme) => {
                    theme.blogs_count = theme.blogs_data.total;
                    // TODO: Pagination. Will only show the first results page
                    theme.blogs = theme.blogs_data._items;
                    // retrieve the public url for each blog
                    theme.blogs.forEach((blog) => {
                        blogService.getPublicUrl(blog).then((url) => {
                            blog.iframe_url = $sce.trustAsResourceUrl(url);
                        });
                    });
                    parseTheme(theme);
                });
                // object that represent the themes hierachy
                const themesHierachy = getHierachyFromThemesCollection(themes);
                // update the scope

                angular.extend(self, {
                    themesHierachy: themesHierachy,
                    themes: themes,
                    loading: false,
                });
                return themes;
            });
        }
        angular.extend(self, {
            mailto: 'mailto:upgrade@liveblog.pro?subject=' +
                encodeURIComponent(location.hostname) +
                ' ' +
                config.subscriptionLevel,
            themeBlogsModal: false, // modal is disabled by default.
            selectedBlog: false,
            isCustomThemesFeatureEnabled: () => featuresService.isEnabled('custom_themes'),
            // loading indicatior for the first timeload.
            loading: true,
            setNotificationCookie: function(cookieName, cookieValue) {
                if (/MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
                    document.cookie = cookieName + '=' + cookieValue + ';path=/';
                }
                document.cookie = encodeURIComponent(cookieName + '=') + encodeURIComponent(cookieValue + ';')
                 + 'expires=0;path=/';
            },
            getNotificationCookie: function(cookieName) {
                if (getCookie(cookieName)) {
                    return true;
                }

                function getCookie(cookieName) {
                    var name = cookieName + '=';
                    var decodedCookie = decodeURIComponent(document.cookie);
                    var cookieArray = decodedCookie.split(';');

                    for (var i = 0; i < cookieArray.length; i++) {
                        var temp = cookieArray[i];

                        // tslint:disable-next-line
                        while (temp.charAt(0) == ' ') {
                            temp = temp.substring(1);
                        }

                        if (temp.indexOf(name) === 0) {
                            return temp.substring(name.length, temp.length);
                        }
                    }
                    return '';
                }
            },
            getTheme: function(name) {
                return _.find(self.themes, (theme) => theme.name === name);
            },
            isDefaultTheme: function(theme) {
                if (angular.isDefined(self.globalTheme)) {
                    return self.getTheme(self.globalTheme.value).name === theme.name;
                }
            },
            cannotBeRemoved: function(theme) {
                const hasChildren = self.themes.some((t) => t.extends === theme.name);

                const systemThemes = ['angular', 'classic', 'default', 'amp', 'simple'];
                const isSystemTheme = systemThemes.indexOf(theme.name) !== -1;

                const isUserNotAllowed = !privileges.userHasPrivileges({themes_delete: 1});

                return hasChildren || isSystemTheme || isUserNotAllowed;
            },
            openThemeBlogsModal: function(theme) {
                if (theme.blogs.length) {
                    self.selectedTheme = theme;
                    self.themeBlogsModal = true;
                }
            },
            closeThemeBlogsModal: function(theme) {
                if (self.selectedBlog) {
                    self.selectedBlog = false;
                } else {
                    self.themeBlogsModal = false;
                }
            },
            download: function(theme) {
                api.themes.getUrl().then((url) => {
                    $window.location = url.replace('/themes', '/theme-download/' + theme.name);
                });
            },
            redeploy: function(theme) {
                $http.defaults.headers.common.Authorization = session.token;
                api.themes.getUrl().then((url) => {
                    $http({
                        url: url.replace('/themes', '/theme-redeploy/' + theme.name),
                        method: 'GET',
                    }).then(() => {
                        notify.info(gettext('Theme redeployed.'));
                    });
                });
            },

            makeDefault: function(theme) {
                if (self.globalTheme) {
                    api
                        .global_preferences
                        .save(self.globalTheme, {key: 'theme', value: theme.name})
                        .then((data) => {
                            notify.info(gettext('Default theme saved'));
                            self.globalTheme = data;
                        });
                } else {
                    api.global_preferences.save({key: 'theme', value: theme.name}).then((data) => {
                        notify.info(gettext('Default theme saved'));
                        self.globalTheme = data;
                    });
                }
            },
            removeTheme: function(theme) {
                modal.confirm(gettext('Are you sure you want to remove this theme?'))
                    .then(() => api.themes.remove(angular.copy(theme)))
                    .then((message) => {
                        notify.info(gettext('Theme "' + theme.label + '" removed.'));
                        loadThemes();
                    })
                    .catch((error) => {
                        if (error) {
                            notify.error('An error occured. ' + error.data.error);
                            loadThemes();
                        }
                    });
            },
            switchBlogPreview: function(blog) {
                // copy the selected blog
                self.selectedBlog = angular.copy(blog);
            },
            save: function() {
                notify.info(gettext('Saving changes'));
            },
            close: function() {
                // return to blog list page
                $location.path('/liveblog/');
            },
            uploadThemeFile: function(e) {
                // show longer lasting message when uploading the theme, as on some situations it may take some time
                const notificationId = notify.info(gettext('Uploading the theme, please wait...'), 120000);

                api.themes.getUrl().then((url) => {
                    upload
                        .start({
                            method: 'POST',
                            url: url.replace('/themes', '/theme-upload'),
                            data: {media: e.files[0]},
                        })
                        .then((response) => {
                            loadThemes().then(() => {
                                notify.removeById(notificationId);
                                notify.info(gettext('Theme uploaded and added'));
                            });
                        }, (error) => {
                            notify.removeById(notificationId);
                            notify.error(error.data._message || error.data._error);
                        });
                });
            },
            themePreviewModal: false,
            openThemePreview: function(theme) {
                if (!theme.screenshot_url) {
                    return false;
                }
                self.themePreviewModal = true;
                self.themePreviewModalTheme = theme;
            },
            openThemeSettings: function(theme) {
                self.themeSettingsModal = true;
                self.themeSettingsModalTheme = theme;
            },
            hasReachedThemesLimit: function() {
                if (!self.themes) {
                    return false;
                }

                const themes = self.themes.filter((theme) => theme.name !== config.excludedTheme);

                return featuresService.isLimitReached('custom_themes', themes.length);
            },
            upgradeModal: false,
            showUpgradeModal: function() {
                self.upgradeModal = true;
            },
            closeUpgradeModal: function() {
                self.upgradeModal = false;
            },
        });

        loadThemes();
    }

    return angular.module('liveblog.themes', ['liveblog.features'])
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('/themes/', {
                    label: gettext('Theme Manager'),
                    controller: LiveblogThemesController,
                    controllerAs: 'self',
                    category: superdesk.MENU_MAIN,
                    adminTools: true,
                    privileges: {global_preferences: 1},
                    templateUrl: listTpl,
                });
        }])
        .filter('githubUrlFromGit', () => function(string) {
            function githubUrlFromGit(url, opts) {
                if (!url) {
                    return '';
                }
                // from https://github.com/tj/node-github-url-from-git
                // generate the git:// parsing regex
                // with options, e.g., the ability
                // to specify multiple GHE domains.
                const githubRe = function(opts = {}) {
                    // whitelist of URLs that should be treated as GitHub repos.
                    const baseUrls = ['gist.github.com', 'github.com'].concat(opts.extraBaseUrls || []);
                    // build regex from whitelist.

                    return new RegExp(
                        /^(?:https?:\/\/|git:\/\/|git\+ssh:\/\/|git\+https:\/\/)?(?:[^@]+@)?/.source +
                            '(' + baseUrls.join('|') + ')' +
                            /[:/]([^/]+\/[^/]+?|[0-9]+)$/.source
                    );
                };
                const matches = githubRe(opts).exec(url.replace(/\.git(#.*)?$/, ''));

                if (matches) {
                    const [, host, path] = matches;

                    return `https://${host}/${path}`;
                }
                return '';
            }
            return githubUrlFromGit(string);
        })
        .filter('stashUrlFromGit', () => function(string) {
            function stashUrlFromGit(url, opts) {
                if (!url) {
                    return '';
                }
                const stashRe = function(opts = {}) {
                    // whitelist of URLs that should be treated as Stash, BitBucket repos.
                    const baseUrls = ['stash.sourcefabric.org'].concat(opts.extraBaseUrls || []);

                    // build regex from whitelist.
                    return new RegExp(
                        /^(?:https?:\/\/|git:\/\/|git\+ssh:\/\/|git\+https:\/\/)?(?:[^@]+@)?/.source +
                        '(' + baseUrls.join('|') + ')' +
                        /[:/]([^/]+\/)([^/]+\/)(.*?)$/.source
                    );
                };
                const matches = stashRe(opts).exec(url.replace(/\.git(#.*)?$/, ''));

                if (matches) {
                    const [, host, , organization, project] = matches;

                    return `https://${host}/rest/api/latest/projects/${organization}repos/${project}`;
                }
                return '';
            }
            return stashUrlFromGit(string);
        })
        .config(['apiProvider', function(apiProvider) {
            apiProvider.api('global_preferences', {
                type: 'http',
                backend: {rel: 'global_preferences'},
            });
            apiProvider.api('themes', {
                type: 'http',
                backend: {rel: 'themes'},
            });
            apiProvider.api('blogs', {
                type: 'http',
                backend: {rel: 'blogs'},
            });
        }]);
})();
