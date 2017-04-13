import consumerListTpl from 'scripts/liveblog-syndication/views/consumer-list.html';

export default function lbConsumers() {
    return {
        templateUrl: consumerListTpl,
        controller: ['$scope', '$controller', function($scope, $controller) {
            $scope.endPoint = 'consumers';
            $scope.entryName = 'consumer';

            angular.extend(this, $controller('BaseController', {$scope: $scope}));

            // Update webhook status on incoming notification
            $scope.$on('consumers', (e, data) => {
                if ($scope.consumers
                && $scope.consumers._items.length > 0
                && data.consumer
                && data.consumer.hasOwnProperty('webhook_enabled')) {
                    $scope.consumers._items.map((consumer) => {
                        if (consumer._id === data) {
                            consumer.webhook_enabled = data.consumer.webhook_enabled;
                        }

                        return consumer;
                    });
                }
            });
        }]
    };
}
