liveblogMarketplace
    .factory('MarketplaceActions', ['Dispatcher', 'api', '$http', 'lodash',
        function(Dispatcher, api, $http, _) {
            return {
                getBlogs: function(filters) {
                    api.get('/marketplace/blogs', { where: filters })
                        .then(function(blogs) {
                            Dispatcher.dispatch({
                                type: 'ON_GET_BLOGS',
                                blogs: blogs
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

                    api
                        .get('/marketplace/blogs', { where: filters })
                        .then(function(blogs) {
                            Dispatcher.dispatch({
                                type: 'ON_FILTER_BLOGS',
                                blogs: blogs,
                                filters: filters
                            });
                        })
                        .catch(function(error) {
                            Dispatcher.dispatch({
                                type: 'ON_FILTER_BLOGS',
                                blogs: { _items: {} },
                                filters: filters
                            });
                        })
                },
                togglePanel: function(value) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLED_PANEL',
                        searchPanel: value
                    });
                }
            }
        }]);
