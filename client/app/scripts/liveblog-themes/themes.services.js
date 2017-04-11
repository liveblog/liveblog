(function() {
    angular.module('liveblog.themes')
    .service('themesService', ['$sce', 'api', 'blogService', function($sce, api, blogService) {
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
                theme.author = {
                    'name': authorArray[1],
                    'email': authorArray[2],
                    'url': authorArray[3]
                };
            }
        }
        // Initialization
        /**
         * Collect a list of options for the given theme and its parents
         * @param {object} theme
         * @returns {array} list of options
         */
        function collectOptions(theme, options, parent) {
            var currenTheme = parent || theme;
            // options is used for recursiveness
            options = options || [];
            theme.settings = theme.settings || {};
            // keep the theme's options in `options`
            if (currenTheme.options) {
                var alreadyPresent = _.map(options, function(o) {return o.name;});
                // keep only options that are not already saved (children options are prioritary)
                options = _.filter(currenTheme.options, function(option) {
                    return alreadyPresent.indexOf(option.name) === -1;
                }).concat(options);
            }
            // retrieve parent options
            if (currenTheme.extends) {
                return api.themes.getById(currenTheme.extends).then(function(parentTheme) {
                    return collectOptions(currenTheme, options, parentTheme);
                });
            }

            // return the options when there is no more parent theme
            // set default settings value from options default values
            options.forEach(function(option) {
                if (!angular.isDefined(theme.settings[option.name])) {
                    theme.settings[option.name] = option.default;
                }
            });
        }
        return {
            getHierachy: function (themes) {
                return getHierachyFromThemesCollection(themes);
            },
            get: function(name, options) {
                var criteria = {};
                options = options || {};
                angular.extend(options, {
                    blogs: false,
                    details: true
                });
                if (name) {
                    criteria = {'where': {'name': name}};
                }
                return api.themes.query(criteria).then(function(data) {
                    var themes = data._items;
                    themes.forEach(function(theme) {
                        if (options.details) {
                            collectOptions(theme);
                        }
                        if (options.blogs) {
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
                        }
                        parseTheme(theme);
                    });
                    return themes;
                });
            }
        }
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
})();
