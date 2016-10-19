liveblogSyndication
    .controller('ConsumersController', ['$scope', '$controller', function($scope, $controller) {
        $scope.endPoint = 'consumers';
        $scope.entryName = 'consumer';

        angular.extend(this, $controller('BaseController', {$scope: $scope}));
    }]);
