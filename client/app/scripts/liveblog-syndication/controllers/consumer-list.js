liveblogSyndication
    .controller('ConsumerController', ['$scope', 'api', function($scope, api) {
        api.consumers.query().then(function(consumers) {
            $scope.consumers = consumers;
        });

        $scope.createConsumer = function() {
            console.log('create consumer');
            $scope.selected = { consumer: true };
        };

        $scope.render = function(data) {
            console.log('re-rendering stuff here', data);
        };
    }]);
