liveblogSyndication
    .controller('ConsumersController', ['$scope', 'api', function($scope, api) {
        api.consumers.query().then(function(consumers) {
            $scope.consumers = consumers;
        })
        .catch(function(err) {
            notify.pop();
            notify.error(gettext('Fatal error!'));
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
