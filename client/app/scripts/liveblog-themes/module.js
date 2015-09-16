(function() {
    'use strict';

    LiveblogThemesController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q', '$sce', 'config', 'lodash', 'upload'];
    function LiveblogThemesController($scope, api, $location, notify, gettext, $q, $sce, config, _, upload) {
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
                    } else {
                        if (index === -1) {
                            todo.push([name, extend]);
                        }
                    }
                } else {
                    if (!angular.isDefined(themes_hierachy[name])) {
                        themes_hierachy[name] = {};
                    }
                }
            }
            themes.map(function(theme) {
                addToHierarchy(theme.name, theme['extends']);
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
                theme.author = {
                    'name': authorArray[1],
                    'email': authorArray[2],
                    'url': authorArray[3]
                };
            }
        }
        // Modal is disabled by default.
        $scope.themeBlogsModal = false;
        // this is used to when a blog is selected.
        $scope.selectedBlog = false;
        // loading indicatior for the first timeload.
        $scope.loading = true;
        $scope.getTheme = function(name) {
            return _.find($scope.themes, function(theme) {
                return theme.name === name;
            });
        };

        $scope.isDefaultTheme = function(theme) {
            if (angular.isDefined($scope.globalTheme)) {
                return $scope.getTheme($scope.globalTheme.value).name === theme.name;
            }
        };

        $scope.hasChildren = function(theme) {
            return $scope.themes.some(function(t) {
                return t['extends'] === theme.name;
            });
        };

        $scope.openThemeBlogsModal = function(theme) {
            if (theme.blogs.length) {
                $scope.selectedTheme = theme;
                $scope.themeBlogsModal = true;
            }
        };

        $scope.closeThemeBlogsModal = function(theme) {
            if ($scope.selectedBlog) {
                $scope.selectedBlog = false;
            } else {
                $scope.themeBlogsModal = false;
            }
        };

        $scope.makeDefault = function(theme) {
            if ($scope.globalTheme) {
                api.global_preferences.save($scope.globalTheme, {'key': 'theme', 'value': theme.name}).then(function(data) {
                    notify.pop();
                    notify.info(gettext('Default theme saved'));
                    $scope.globalTheme = data;
                });
            } else {
                api.global_preferences.save({'key': 'theme', 'value': theme.name}).then(function(data) {
                    notify.pop();
                    notify.info(gettext('Default theme saved'));
                    $scope.globalTheme = data;
                });
            }
        };

        $scope.removeTheme = function(theme) {
            api.themes.remove(angular.copy(theme)).then(function(message) {
                notify.pop();
                notify.info(gettext('Theme "' + theme.label + '" removed.'));
                loadThemes();
            }, function(error) {
                notify.pop();
                notify.error('An error occured. ' + error.data.error);
                loadThemes();
            });
        };

        $scope.switchBlogPreview = function(blog) {
            $scope.selectedBlog = blog;
            $scope.selectedBlog.iframe_url = $sce.trustAsResourceUrl(
                blog.public_url || config.server.url.replace('/api', '/embed/' + blog._id
            ));
        };

        $scope.save = function() {
            notify.pop();
            notify.info(gettext('Saving changes'));
        };
        $scope.close = function() {
            //return to blog list page
            $location.path('/liveblog/');
        };

        function loadThemes() {
            // load only global preference for themes.
            api.global_preferences.query({'where': {'key': 'theme'}}).then(function(global_preferences) {
                $scope.globalTheme = _.find(global_preferences._items, function(item) {
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
                                query: {filtered: {filter: {term: {'theme._id': theme._id}}}}
                            }
                        };
                    api.blogs.query(criteria).then(function(data) {
                        theme.blogs_count = data._meta.total;
                        // TODO: Pagination. Will only show the first results page
                        theme.blogs = data._items;
                    });
                    parseTheme(theme);
                });
                // object that represent the themes hierachy
                var themes_hierachy = getHierachyFromThemesCollection(themes);
                // update the scope
                angular.extend($scope, {
                    themesHierachy: themes_hierachy,
                    themes: themes,
                    loading: false
                });
                return themes;
            });
        }

        $scope.uploadThemeFile = function(e) {
            notify.pop();
            notify.info('Uploading the theme...');
            api.themes.getUrl().then(function(url) {
                upload.start({
                    method: 'POST',
                    url: url.replace('themes', 'theme-upload'),
                    data: {media: e.files[0]}
                })
                .then(function(response) {
                    loadThemes().then(function() {
                        notify.pop();
                        notify.info('Theme uploaded and added');
                    });
                }, function(error) {
                    notify.pop();
                    notify.error(error.data.error);
                });
            });
        };

        loadThemes();
    }

    var liveblogThemeModule = angular.module('liveblog.themes', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/themes/', {
                label: gettext('Theme Manager'),
                controller: LiveblogThemesController,
                category: superdesk.MENU_MAIN,
                privileges: {'global_preferences': 1},
                templateUrl: 'scripts/liveblog-themes/views/list.html'
            });
    }])
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
