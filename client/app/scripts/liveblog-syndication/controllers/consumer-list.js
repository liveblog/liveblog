liveblogSyndication
    .controller('ConsumerController', ['$scope', 'api', function($scope, api) {
        api.consumers.query().then(function(consumers) {
            $scope.consumers = consumers;
        });

        $scope.createConsumer = function() {
            console.log('create consumer');
            $scope.selected = { consumer: true };
        };

        $scope.render = function(newConsumer) {
            $scope.consumers._items.unshift(newConsumer);
            $scope.selected = { consumer: false };
        };
    }]);
