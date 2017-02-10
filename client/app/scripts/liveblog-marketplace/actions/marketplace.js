liveblogMarketplace
    .factory('MarketplaceActions', ['Dispatcher', 'api', '$http', 'lodash',
        function(Dispatcher, api, $http, _) {
            return {
                getBlogs: function(filters) {
                    //var marketer = {};

                    //if (filters.hasOwnProperty('marketer._id'))
                    //    marketer = filters['marketer._id'];

                    api.get('/marketplace/blogs', { where: filters })
                        .then(function(blogs) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_BLOGS',
                                blogs: blogs,
                                filters: filters
                                //currentMarketer: marketer
                            });
                        });
                },
                getMarketers: function() {
                    api.get('/marketplace/marketers').then(function(marketers) {
                        Dispatcher.dispatch({
                            type: 'ON_GET_MARKETERS',
                            marketers: marketers
                        });
                    });
                },
                toggleFilter: function(filters, type, value) {
                    if (filters.hasOwnProperty(type) && filters[type] == value)
                        filters = _.omit(filters, type);
                    else
                        filters[type] = value;

                    //var marketer = {};

                    //if (filters.hasOwnProperty('marketer._id'))
                    //    marketer = filters['marketer._id'];

                    api
                        .get('/marketplace/blogs', { where: filters })
                        .then(function(blogs) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_BLOGS',
                                blogs: blogs,
                                filters: filters
                                //currentMarketer: marketer
                            });
                        })
                        .catch(function(error) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_BLOGS',
                                blogs: { _items: {} },
                                filters: filters
                                //currentMarketer: marketer
                            });
                        })
                },
                togglePanel: function(value) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLED_PANEL',
                        searchPanel: value
                    });
                },
                openEmbedModal: function(blog) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLED_MODAL',
                        embedModal: true,
                        currentBlog: blog
                    });
                },
                closeEmbedModal: function() {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLED_MODAL',
                        embedModal: false,
                        currentBlog: {}
                    });
                }
            }
        }]);
