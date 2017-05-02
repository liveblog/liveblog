export default function marketplaceReducers() {
    var findMarketer = function(marketers, filters) {
        var currentMarketer = {};

        if (marketers._items && filters['marketer._id'])
            marketers._items.forEach(function(marketer) {
                if (filters['marketer._id'] === marketer._id)
                    currentMarketer = marketer;
            });

        return currentMarketer;
    };

    return function(state, action) {
        switch (action.type) {
            case 'ON_GET_BLOGS':
                return angular.extend(state, {
                    blogs: action.blogs,
                    filters: action.filters,
                    currentMarketer: findMarketer(state.marketers, action.filters)
                });

            case 'ON_GET_MARKETERS':
                return angular.extend(state, {
                    marketers: action.marketers,
                    currentMarketer: findMarketer(action.marketers, state.filters)
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
}
