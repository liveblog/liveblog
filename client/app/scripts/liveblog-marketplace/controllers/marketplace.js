liveblogMarketplace
    .controller('MarketplaceController', ['$scope', '$location', 'api',
        function($scope, $location, api) {
            $scope.states = [
                'Marketers',
                'Producers'
            ];

            $scope.searchPanel = true;
            $scope.activeState = $scope.states[0];

            $scope.switchTab = function(state) {
                $scope.activeState = state;
            };

            api.get('/marketplace/blogs')
                .then(function(blogs) {
                    $scope.blogs = blogs;
                });

            api.producers.query()
                .then(function(producers) {
                    $scope.producers = producers;
                });
        }]);
