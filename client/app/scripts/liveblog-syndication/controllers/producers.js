liveblogSyndication
    .controller('ProducersController', ['$scope', '$controller', function($scope, $controller) {
        $scope.endPoint = 'producers';
        $scope.entryName = 'producer';

        angular.extend(this, $controller('BaseController', {$scope: $scope}));
    }]);
