liveblogSyndication
    .controller('ConsumerController', ['$scope', 'api', function($scope, api) {
        api.consumers.query().then(function(consumers) {
            console.log('consumers', consumers);
        });

        $scope.createConsumer = function() {
            console.log('create consumer');
            $scope.selected = { consumer: true };
        };
    }]);
