(function() {
    angular.module('liveblog.themes')
        .service('themesService', ['$sce', 'api', 'blogService', function($sce, api, blogService) {
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

                    Object.keys(collection).forEach((key) => {
                        if (key === name) {
                            return collection[key];
                        }
                        if (angular.isObject(collection[key])) {
                            const res = getParentNode(name, collection[key]);

                            if (angular.isDefined(res)) {
                                return res;
                            }
                        }
                    });
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
                    theme.author = {
                        name: authorArray[1],
                        email: authorArray[2],
                        url: authorArray[3],
                    };
                }
            }
            // Initialization
            /**
         * Collect a list of options for the given theme and its parents
         * @param {object} theme
         * @returns {array} list of options
         */
            function collectOptions(theme, optionsParam = [], parent) {
                const currenTheme = parent || theme;
                // options is used for recursiveness

                let options = optionsParam;

                theme.settings = theme.settings || {};
                // keep the theme's options in `options`
                if (currenTheme.options) {
                    const alreadyPresent = _.map(options, (o) => o.name);
                    // keep only options that are not already saved (children options are prioritary)

                    options = _.filter(currenTheme.options, (option) =>
                        alreadyPresent.indexOf(option.name) === -1
                    ).concat(options);
                }
                // retrieve parent options
                if (currenTheme.extends) {
                    return api.themes.getById(currenTheme.extends).then((parentTheme) =>
                        collectOptions(currenTheme, options, parentTheme)
                    );
                }

                // return the options when there is no more parent theme
                // set default settings value from options default values
                options.forEach((option) => {
                    if (!angular.isDefined(theme.settings[option.name])) {
                        theme.settings[option.name] = option.default;
                    }
                });
            }
            return {
                getHierachy: function(themes) {
                    return getHierachyFromThemesCollection(themes);
                },
                get: function(name, optionsParam = {}) {
                    let criteria = {};

                    const options = optionsParam;

                    angular.extend(options, {
                        blogs: false,
                        details: true,
                    });
                    if (name) {
                        criteria = {where: {name: name}};
                    }
                    return api.themes.query(criteria).then((data) => {
                        const themes = data._items;

                        themes.forEach((theme) => {
                            if (options.details) {
                                collectOptions(theme);
                            }
                            if (options.blogs) {
                            // create criteria to load blogs with the theme.
                                const criteria = {
                                    source: {
                                        query: {match: {'blog_preferences.theme': theme.name}},
                                    },
                                };

                                api.blogs.query(criteria).then((data) => {
                                    theme.blogs_count = data._meta.total;
                                    // TODO: Pagination. Will only show the first results page
                                    theme.blogs = data._items;
                                    // retrieve the public url for each blog
                                    theme.blogs.forEach((blog) => {
                                        blogService.getPublicUrl(blog).then((url) => {
                                            blog.iframe_url = $sce.trustAsResourceUrl(url);
                                        });
                                    });
                                });
                            }
                            parseTheme(theme);
                        });
                        return themes;
                    });
                },
            };
        }])
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
