import freetypeSelectTpl from 'scripts/liveblog-edit/views/freetype-select.html';

export default function freetypeLink() {
    return {
        restrict: 'E',
        templateUrl: freetypeSelectTpl,
        controller: ['$scope', function($scope) {
            $scope.split = $scope.split || ',';
            $scope.renderOptions = $scope.options.split($scope.split);
        }],
        scope: {
            select: '=',
            validation: '=',
            options: '@',
            split: '@'
        }
    };
}
