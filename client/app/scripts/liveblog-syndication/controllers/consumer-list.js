liveblogSyndication
    .controller('ConsumerController', ['$scope', 'api', function($scope, api) {
        api.consumers.query().then(function(consumers) {
            $scope.consumers = consumers;
        });

        $scope.createConsumer = function() {
            $scope.selected = { consumer: { name: ''}};
        };

        $scope.render = function(newConsumer) {
            $scope.consumers._items.unshift(newConsumer);
            $scope.selected = {};
        };

        $scope.closePreview = function() {
            $scope.selected = {};
        };
    }]);
