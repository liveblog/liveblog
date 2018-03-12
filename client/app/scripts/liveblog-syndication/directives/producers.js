import producerListTpl from 'scripts/liveblog-syndication/views/producer-list.ng1';

export default function lbProducers() {
    return {
        templateUrl: producerListTpl,
        controller: ['$scope', '$controller', function($scope, $controller) {
            $scope.endPoint = 'producers';
            $scope.entryName = 'producer';

            angular.extend(this, $controller('BaseController', {$scope: $scope}));
        }]
    };
}
