export default function lbConsumers() {
    return {
        templateUrl: 'scripts/liveblog-syndication/views/consumer-list.html',
        controller: ['$scope', '$controller', function($scope, $controller) {
            $scope.endPoint = 'consumers';
            $scope.entryName = 'consumer';

            angular.extend(this, $controller('BaseController', {$scope: $scope}));
        }]
    }
}
