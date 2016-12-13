liveblogMarketplace
    .controller('MPProducerController', ['$scope', function($scope) {
        $scope.states = [
            { text: 'Active Blogs' },
            { text: 'Archived Blogs' }
        ];

        $scope.blogs = {_items: [{
            _id: 0,
            title: 'Blog number 1',
            description: 'Lorem ipsum dolor sit amet'
        }], _meta: { total: 1 }};
    }]);
