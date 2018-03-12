freetypeCollectionAdd.$inject = ['$compile'];

export default function freetypeCollectionAdd($compile) {
    return {
        restrict: 'E',
        template: '<button ng-click="ftca.add()" class="freetype-btn">+</button>',
        controller: ['$scope', function($scope) {
            this.add = function() {
                const last = _.last($scope.vector);
                const el = {};

                for (const key in last) {
                    // if the key starts with $$ it is angular internal so skip it.
                    if (last.hasOwnProperty(key) && key.substr(0, 2) !== '$$') {
                        el[key] = '';
                    }
                }
                $scope.vector.push(el);
            };
        }],
        controllerAs: 'ftca',
        scope: {
            vector: '='
        }
    };
}
