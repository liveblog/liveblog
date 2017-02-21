consumersController.$inject = ['$scope', '$controller'];

export default function consumersController($scope, $controller) {
    $scope.endPoint = 'consumers';
    $scope.entryName = 'consumer';

    angular.extend(this, $controller('BaseController', {$scope: $scope}));
};
