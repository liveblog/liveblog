(function() {
    'use strict';

    LiveblogThemesController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q', '$sce', 'config'];
    function LiveblogThemesController($scope, api, $location, notify, gettext, $q, $sce, config) {
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
            // If the screenshot string is not a url then compose it from server api url.
            var protocolRegex = /^(http[s]?:)?\/{2}/;
            if (theme.screenshot && !protocolRegex.test(theme.screenshot)) {
                theme.screenshot = config.server.url.replace('/api', '') + '/embed_assets/themes/' + theme.name + '/' + theme.screenshot;
            }
        }
        // Modal is disabled by default.
        $scope.themeBlogsModal = false;
        // this is used to when a blog is selected.
        $scope.selectedBlog = false;
        // loading indicatior for the first timeload.
        $scope.loading = true;
        // load only global preference for themes.
        api.global_preferences.query({'where': {'key': 'theme'}}).then(function(data) {
            data._items.forEach(function(item) {
                if (item.key === 'theme') {
                    $scope.globalTheme = item;
                    return;
                }
            });
            // load all the themes.
            api.themes.query().then(function(data) {

                // filter theme with label (without label are `generic` from inheritance)
                $scope.themes = data._items.filter(function(theme) {
                    if (angular.isDefined(theme.label)) {
                        // set the priority for default theme.
                        if ($scope.globalTheme.value === theme.name) {
                            theme.order = 0;
                        } else {
                            theme.order = 1;
                        }
                        // create criteria to load blogs with the theme.
                        var criteria = {
                                source: {
                                    query: {filtered: {filter: {term: {'theme._id': theme._id}}}}
                                }
                            };
                        api.blogs.query(criteria).then(function(data) {
                            theme.blogs = data._items;
                        });
                        parseTheme(theme);
                        return true;
                    }
                    return false;
                });
            $scope.loading = false;
            });
        });

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
            api.themes.query().then(function(data) {
                data._items.forEach(function(item) {
                    if (item._id === theme._id) {
                    console.log('we will delete the theme');
                }
                else {
                    console.log('we will not delete the theme')
                }
            });
            });
            // delete theme

            // _.remove($scope.themes._items, theme);
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
    }

    var liveblogThemeModule = angular.module('liveblog.themes', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/themes/', {
                label: gettext('Theme Manager'),
                controller: LiveblogThemesController,
                category: superdesk.MENU_MAIN,
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
