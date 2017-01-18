producersController.$inject = ['$scope', '$controller'];

export default function producersController($scope, $controller) {
    $scope.endPoint = 'producers';
    $scope.entryName = 'producer';

    angular.extend(this, $controller('BaseController', {$scope: $scope}));
};
