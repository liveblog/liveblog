liveblogMarketplace
    .factory('MarketplaceActions', ['Dispatcher', 'api', '$http',
        function(Dispatcher, api, $http) {
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
                toggleFilter: function(type, value) {
                    console.log(type, value);
                },
                togglePanel: function(value) {
                    Dispatcher.dispatch({
                        type: 'ON_TOGGLED_PANEL',
                        searchPanel: value
                    });
                }
            }
        }]);
