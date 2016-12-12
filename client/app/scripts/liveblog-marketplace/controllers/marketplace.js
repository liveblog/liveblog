liveblogMarketplace
    .controller('MarketplaceController', ['$scope', function($scope) {
        $scope.producers = { _items: [
            {
                _id: 0,
                title: 'Deutsche Presse-Argentur',
                description: 'Lorem ipsum dolor sit amet'
            },
            {
                _id: 1,
                title: 'Sourcefabric',
                description: 'Lorem ipsum dolor sit amet'
            }
        ]};
    }]);
