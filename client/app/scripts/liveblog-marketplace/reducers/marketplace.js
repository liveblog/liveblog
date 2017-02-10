liveblogMarketplace
    .factory('MarketplaceReducers', function() {
        return function(state, action) {
            switch (action.type) {
                //case 'ON_GET_BLOGS':
                //    return angular.extend(state, {
                //        blogs: action.blogs
                //    });

                case 'ON_GET_BLOGS':
                    return angular.extend(state, {
                        blogs: action.blogs,
                        filters: action.filters
                    });

                case 'ON_GET_MARKETERS':
                    return angular.extend(state, {
                        marketers: action.marketers
                    });

                case 'ON_TOGGLED_PANEL':
                    return angular.extend(state, {
                        searchPanel: action.searchPanel
                    });

                case 'ON_TOGGLED_MODAL':
                    return angular.extend(state, {
                        embedModal: action.embedModal,
                        currentBlog: action.currentBlog
                    });
            }
        };
    });
