liveblogMarketplace
    .controller('MarketplaceController', ['$scope', '$location', 'api',
        function($scope, $location, api) {
            $scope.states = [
                'Marketers',
                'Producers'
            ];

            $scope.searchPanel = false;
            $scope.activeState = $scope.states[0];

            $scope.switchTab = function(state) {
                $scope.activeState = state;
            };

            //$scope.open = function(producer) {
            //    $location.path('/marketplace/' + producer._id);
            //};

            //api.get('/marketplace/marketers')
            //    .then(function(marketers) {
            //        $scope.marketers = marketers;
            //    });

            api.get('/marketplace/blogs')
                .then(function(blogs) {
                    $scope.blogs = blogs;
                });

            api.producers.query()
                .then(function(producers) {
                    $scope.producers = producers;
                });
        }]);
