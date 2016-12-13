liveblogMarketplace
    .controller('MarketplaceController', ['$scope', '$location', 'api',
        function($scope, $location, api) {
            $scope.states = [
                { text: 'Available Producers' },
                { text: 'Registered Producers' }
            ];

            //$scope.producers = { _items: [{
            //    _id: 0,
            //    title: 'Deutsche Presse-Argentur',
            //    description: 'Lorem ipsum dolor sit amet'
            //},
            //{
            //    _id: 1,
            //    title: 'Sourcefabric',
            //    description: 'Lorem ipsum dolor sit amet'
            //}]};

            $scope.open = function(producer) {
                $location.path('/marketplace/' + producer._id);
            };

            api.get('/marketplace/marketers')
                .then(function(marketers) {
                    console.log('marketers', marketers);
                    $scope.marketers = marketers;
                })
                .catch(function(err) {
                    console.log('err', err);
                })
        }]);
