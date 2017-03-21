export default function freetypeCollectionRemove() {
    return {
        restrict: 'E',
        template: '<button ng-click="ftcr.remove()" class="freetype-btn" ng-show="vector.length!==1">-</button>',
        controller: ['$scope', function($scope) {
            this.remove = function() {
                $scope.vector.splice($scope.index, 1);
            }
        }],
        controllerAs: 'ftcr',
        scope: {
            vector: '=',
            index: '='
        }
    };
}
