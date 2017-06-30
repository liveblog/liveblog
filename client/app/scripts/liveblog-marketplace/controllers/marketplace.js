marketplaceController.$inject = [
    '$scope',
    'Store',
    'MarketplaceActions',
    'MarketplaceReducers',
    '$route',
    'moment'
];

export default function marketplaceController($scope, Store, MarketplaceActions, MarketplaceReducers, $route, moment) {
    var filters = {};

    if ($route.current.params.hasOwnProperty('filters')) {
        filters = JSON.parse($route.current.params.filters);
    }

    $scope.states = [
        'Marketers',
        'Producers'
    ];

    $scope.activeState = $scope.states[0];

    $scope.switchTab = function(state) {
        $scope.activeState = state;
    };

    $scope.togglePanel = function() {
        MarketplaceActions.togglePanel(!$scope.searchPanel);
    };

    $scope.emptyMarketer = function() {
        return !$scope.filters || !$scope.filters.hasOwnProperty('marketer._id');
    };

    $scope.emptyBlogs = function() {
        return $scope.blogs._items.length === 0
            && $scope.forthcomingBlogs._items.length === 0;
    };

    $scope.openEmbedModal = MarketplaceActions.openEmbedModal;

    $scope.store = new Store(MarketplaceReducers, {
        currentBlog: {},
        currentMarketer: {},
        blogs: {_items: []},
        marketers: {_items: []},
        filters: filters,
        searchPanel: true,
        embedModal: false,
        languages: []
    });

    $scope.store.connect((state) => {
        $scope.searchPanel = state.searchPanel;
        $scope.embedModal = state.embedModal;
        $scope.filters = state.filters;
        $scope.currentMarketer = state.currentMarketer;

        $route.updateParams({
            filters: JSON.stringify(state.filters)
        });

        $scope.blogs = {_items: []};
        $scope.forthcomingBlogs = {_items: []};

        state.blogs._items.forEach((blog) => {
            if (moment().diff(blog.start_date) < 0) {
                $scope.forthcomingBlogs._items.push(blog);
            } else {
                $scope.blogs._items.push(blog);
            }
        });

        $scope.forthcomingBlogs._items = $scope.forthcomingBlogs._items.reverse();
    });

    MarketplaceActions.getBlogs(filters);
    MarketplaceActions.getMarketers();
    MarketplaceActions.getLanguages();
}
