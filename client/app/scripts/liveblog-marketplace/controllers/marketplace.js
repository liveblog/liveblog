liveblogMarketplace
    .controller('MarketplaceController', 
        ['$scope', 'Store', 'MarketplaceActions', 'MarketplaceReducers',
        function($scope, Store, MarketplaceActions, MarketplaceReducers) {
            $scope.states = [
                'Marketers',
                'Producers'
            ];

            $scope.searchPanel = true;
            $scope.activeState = $scope.states[0];

            $scope.switchTab = function(state) {
                $scope.activeState = state;
            };

            $scope.store = new Store(MarketplaceReducers, {
                blogs: {},
                marketers: {}
            });

            $scope.store.connect(function(state) {
                $scope.blogs = state.blogs;
            });

            MarketplaceActions.getBlogs();
            MarketplaceActions.getMarketers();

            //api.producers.query()
            //    .then(function(producers) {
            //        $scope.producers = producers;
            //    });
        }]);
