import listTpl from 'scripts/liveblog-themes/views/list.html';

(function() {
    LiveblogThemesController.$inject = ['api', '$location', 'notify', 'gettext',
    '$q', '$sce', 'config', 'lodash', 'upload', 'blogService', '$window', 'modal',
    '$http', 'session'];
    function LiveblogThemesController(api, $location, notify, gettext,
    $q, $sce, config, _, upload, blogService, $window, modal,
    $http, session) {
        var vm = this;
        /**
         * Return a collection that represent the hierachy of the themes
         * @param {array} themes
         * @returns {object} hierachical collection
         */
        function getHierachyFromThemesCollection(themes) {
            var todo = [];
            var themes_hierachy = {};
            function getParentNode(name, collection) {
                collection = collection || themes_hierachy;
                for (var key in collection) {
                    if (collection.hasOwnProperty(key)) {
                        if (key === name) {
                            return collection[key];
                        }
                        if (angular.isObject(collection[key])) {
                            var res = getParentNode(name, collection[key]);
                            if (angular.isDefined(res)) {
                                return res;
                            }
                        }
                    }
                }
            }
            function addToHierarchy(name, extend) {
                if (angular.isDefined(extend)) {
                    var parent_node = getParentNode(extend);
                    var index = _.findIndex(todo, function(a) {
                        return a[0] === name;
                    });
                    if (angular.isDefined(parent_node)) {
                        if (index > -1) {
                            todo.splice(index, 1);
                        }
                        parent_node[name] = {};
                    } else if (index === -1) {
                        todo.push([name, extend]);
                    }
                } else if (!angular.isDefined(themes_hierachy[name])) {
                    themes_hierachy[name] = {};
                }
            }
            themes.forEach(function(theme) {
                addToHierarchy(theme.name, theme.extends);
            });
            var max_loops = todo.length * todo.length;
            while (todo.length > 0 && max_loops > 0) {
                for (var i = 0; i < todo.length; i++) {
                    addToHierarchy(todo[i][0], todo[i][1]);
                }
                max_loops--;
            }
            return themes_hierachy;
        }
        // parse the theme and create or fix properties.
        function parseTheme(theme) {
            var authorRX = /^([^<(]+?)?[ \t]*(?:<([^>(]+?)>)?[ \t]*(?:\(([^)]+?)\)|$)/gm,
                authorArray;
            // If the author is a string then use the format:
            // Name <Email> (Url)
            if (angular.isString(theme.author)) {
                authorArray = authorRX.exec(theme.author);

                if (authorArray) {
                    theme.author = {
                        'name': authorArray[1],
                        'email': authorArray[2],
                        'url': authorArray[3]
                    };
                }
            }
        }
        function loadThemes() {
            // load only global preference for themes.
            api.global_preferences.query({'where': {'key': 'theme'}}).then(function(global_preferences) {
                vm.globalTheme = _.find(global_preferences._items, function(item) {
                    return item.key === 'theme';
                });
            });
            // load all the themes.
            // TODO: Pagination
            return api.themes.query().then(function(data) {
                var themes = data._items;
                themes.forEach(function(theme) {
                    // create criteria to load blogs with the theme.
                    var criteria = {
                            source: {
                                query: {match: {'blog_preferences.theme': theme.name}}
                            }
                        };
                    api.blogs.query(criteria).then(function(data) {
                        theme.blogs_count = data._meta.total;
                        // TODO: Pagination. Will only show the first results page
                        theme.blogs = data._items;
                        // retrieve the public url for each blog
                        theme.blogs.forEach(function(blog) {
                            blogService.getPublicUrl(blog).then(function(url) {
                                blog.iframe_url = $sce.trustAsResourceUrl(url);
                            });
                        });
                    });
                    parseTheme(theme);
                });
                // object that represent the themes hierachy
                var themes_hierachy = getHierachyFromThemesCollection(themes);
                // update the scope
                angular.extend(vm, {
                    themesHierachy: themes_hierachy,
                    themes: themes,
                    loading: false
                });
                return themes;
            });
        }
        angular.extend(vm, {
            mailto: 'mailto:upgrade@liveblog.pro?subject='+
                encodeURIComponent(location.hostname) +
                ' ' +
                config.subscriptionLevel,
            // Modal is disabled by default.
            themeBlogsModal: false,
            // this is used to when a blog is selected.
            selectedBlog: false,
            isSolo: () => config.subscriptionLevel === 'solo',
            // loading indicatior for the first timeload.
            loading: true,
            getTheme: function(name) {
                return _.find(vm.themes, function(theme) {
                    return theme.name === name;
                });
            },
            isDefaultTheme: function(theme) {
                if (angular.isDefined(vm.globalTheme)) {
                    return vm.getTheme(vm.globalTheme.value).name === theme.name;
                }
            },
            hasChildren: function(theme) {
                return vm.themes.some(function(t) {
                    return t.extends === theme.name;
                });
            },
            openThemeBlogsModal: function(theme) {
                if (theme.blogs.length) {
                    vm.selectedTheme = theme;
                    vm.themeBlogsModal = true;
                }
            },
            closeThemeBlogsModal: function(theme) {
                if (vm.selectedBlog) {
                    vm.selectedBlog = false;
                } else {
                    vm.themeBlogsModal = false;
                }
            },
            download: function(theme) {
                api.themes.getUrl().then(function(url) {
                    $window.location = url.replace('/themes', '/theme-download/' + theme.name);
                });
            },
            redeploy: function(theme) {
                $http.defaults.headers.common.Authorization = session.token;
                api.themes.getUrl().then(function(url) {
                    $http({
                        url: url.replace('/themes', '/theme-redeploy/' + theme.name),
                        method: 'GET'
                    }).then(function(){
                        notify.pop();
                        notify.info(gettext('Theme redeployed.'));
                    });
                });
            },

            makeDefault: function(theme) {
                if (vm.globalTheme) {
                    api
                        .global_preferences
                        .save(vm.globalTheme, {'key': 'theme', 'value': theme.name})
                        .then(function(data) {
                            notify.pop();
                            notify.info(gettext('Default theme saved'));
                            vm.globalTheme = data;
                        });
                } else {
                    api.global_preferences.save({'key': 'theme', 'value': theme.name}).then(function(data) {
                        notify.pop();
                        notify.info(gettext('Default theme saved'));
                        vm.globalTheme = data;
                    });
                }
            },
            removeTheme: function(theme) {
                modal.confirm(gettext('Are you sure you want to remove this theme?'))
                    .then(() => api.themes.remove(angular.copy(theme)))
                    .then((message) => {
                        notify.pop();
                        notify.info(gettext('Theme "' + theme.label + '" removed.'));
                        loadThemes();
                    })
                    .catch((error) => {
                        if (error) {
                            notify.pop();
                            notify.error('An error occured. ' + error.data.error);
                            loadThemes();
                        }
                    });
            },
            switchBlogPreview: function(blog) {
                // copy the selected blog
                vm.selectedBlog = angular.copy(blog);
            },
            save: function() {
                notify.pop();
                notify.info(gettext('Saving changes'));
            },
            close: function() {
                //return to blog list page
                $location.path('/liveblog/');
            },
            uploadThemeFile: function(e) {
                notify.pop();
                // show longer lasting message when uploading the theme, as on some situations it may take some time
                notify.info(gettext('Uploading the theme, please wait...'), 120000);
                api.themes.getUrl().then(function(url) {
                    upload.start({
                        method: 'POST',
                        url: url.replace('/themes', '/theme-upload'),
                        data: {media: e.files[0]}
                    })
                    .then(function(response) {
                        loadThemes().then(function() {
                            notify.pop();
                            notify.info(gettext('Theme uploaded and added'));
                        });
                    }, function(error) {
                        notify.pop();
                        notify.error(error.data.error);
                    });
                });
            },
            themePreviewModal: false,
            openThemePreview: function(theme) {
                if (!theme.screenshot_url) {
                    return false;
                }
                vm.themePreviewModal = true;
                vm.themePreviewModalTheme = theme;
            },
            openThemeSettings: function(theme) {
                vm.themeSettingsModal = true;
                vm.themeSettingsModalTheme = theme;
            },
            hasReachedThemesLimit: function() {
                if (!vm.themes)
                    return false;

                var themes = vm.themes.filter(function(theme) {
                    return (theme.name !== config.excludedTheme);
                });

                if (config.subscriptionLevel === 'team')
                    return (themes.length >= config.themeCreationRestrictions.team);

                return false;
            },
            upgradeModal: false,
            showUpgradeModal: function() {
                vm.upgradeModal = true;
            },
            closeUpgradeModal: function() {
                vm.upgradeModal = false;
            }
        });

        loadThemes();
    }

    var liveblogThemeModule = angular.module('liveblog.themes', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/themes/', {
                label: gettext('Theme Manager'),
                controller: LiveblogThemesController,
                controllerAs: 'vm',
                category: superdesk.MENU_MAIN,
                adminTools: true,
                privileges: {'global_preferences': 1},
                templateUrl: listTpl
            });
    }])
    .filter('githubUrlFromGit', function() {
        return function(string) {
            function githubUrlFromGit(url, opts) {
                // from https://github.com/tj/node-github-url-from-git
                // generate the git:// parsing regex
                // with options, e.g., the ability
                // to specify multiple GHE domains.
                var github_re = function(opts) {
                    opts = opts || {};
                    // whitelist of URLs that should be treated as GitHub repos.
                    var baseUrls = ['gist.github.com', 'github.com'].concat(opts.extraBaseUrls || []);
                    // build regex from whitelist.
                    return new RegExp(
                        /^(?:https?:\/\/|git:\/\/|git\+ssh:\/\/|git\+https:\/\/)?(?:[^@]+@)?/.source +
                        '(' + baseUrls.join('|') + ')' +
                        /[:\/]([^\/]+\/[^\/]+?|[0-9]+)$/.source
                    );
                };
                try {
                    var m = github_re(opts).exec(url.replace(/\.git(#.*)?$/, ''));
                    var host = m[1];
                    var path = m[2];
                    return 'https://' + host + '/' + path;
                } catch (err) {
                    // ignore
                }
            }
            return githubUrlFromGit(string);
        };
    })
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('global_preferences', {
            type: 'http',
            backend: {rel: 'global_preferences'}
        });
        apiProvider.api('themes', {
            type: 'http',
            backend: {rel: 'themes'}
        });
        apiProvider.api('blogs', {
            type: 'http',
            backend: {rel: 'blogs'}
        });
    }]);
    return liveblogThemeModule;

})();
