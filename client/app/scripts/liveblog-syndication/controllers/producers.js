liveblogSyndication
    .controller('ProducersController', ['$scope', 'api', function($scope, api) {
        api.producers.query().then(function(producers) {
            $scope.producers = producers;
        })
        .catch(function(err) {
            notify.pop();
            notify.error(gettext('Fatal error!'));
        });

        $scope.createProducer = function() {
            $scope.selected = { producer: { name: ''}};
        };

        $scope.render = function(newProducer) {
            $scope.producers._items.unshift(newProducer);
            $scope.selected = {};
        };

        $scope.closePreview = function() {
            $scope.selected = {};
        };
    }]);
