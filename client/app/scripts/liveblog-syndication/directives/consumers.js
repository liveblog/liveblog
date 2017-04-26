import consumerListTpl from 'scripts/liveblog-syndication/views/consumer-list.html';

export default function lbConsumers() {
    return {
        templateUrl: consumerListTpl,
        controller: ['$scope', '$controller', function($scope, $controller) {
            $scope.endPoint = 'consumers';
            $scope.entryName = 'consumer';

            angular.extend(this, $controller('BaseController', {$scope: $scope}));
        }]
    };
}
