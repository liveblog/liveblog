liveblogMarketplace
    .factory('MarketplaceActions', ['Dispatcher', 'api', '$http', 'lodash',
        function(Dispatcher, api, $http, _) {
            return {
                getBlogs: function() {
                    api.get('/marketplace/blogs').then(function(blogs) {
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
                    var query;

                    if (filters.hasOwnProperty(type) && filters[type] == value)
                        filters = _.omit(filters, type);
                    else
                        filters[type] = value;

                    if (Object.keys(filters).length === 0) {
                        query = api.get('/marketplace/blogs');

                    } else if (Object.keys(filters).length === 1) {
                        var key = Object.keys(filters)[0];

                        if (key == 'category')
                            query = api.get('/marketplace/blogs', {
                                where: {category: filters[key]}
                            });
                        else
                            query = api.get('/marketplace/marketers/' + filters[key] + '/blogs');

                    } else {
                        query = api.get(
                            '/marketplace/marketers/' + filters['marketer'] + '/blogs',
                            { where: { category: filters['category'] } }
                        );
                    }

                    query.then(function(blogs) {
                        Dispatcher.dispatch({
                            type: 'ON_FILTER_BLOGS',
                            blogs: blogs,
                            filters: filters
                        });
                    });
                },
                togglePanel: function(value) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLED_PANEL',
                        searchPanel: value
                    });
                }
            }
        }]);
