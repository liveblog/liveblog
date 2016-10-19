liveblogSyndication
    .controller('ProducerController', ['$scope', 'api', function($scope, api) {
        api.producers.query().then(function(producers) {
            $scope.producers = producers;
        });

        $scope.createProducer = function() {
            $scope.selected = { producer: { name: ''}};
        };
    }]);
