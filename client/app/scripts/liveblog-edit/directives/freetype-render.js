freetypeRender.$inject = ['$compile', '$rootScope', 'freetypeService'];

/**
* Main directive to render the freetype editor.
*/
export default function freetypeRender($compile, $rootScope, freetypeService) {
    return {
        restrict: 'E',
        link: function(scope, element, attrs) {
            scope.$watch('freetype', (freetype) => {
                element.html(freetypeService.transform(freetype.template, scope));
                $compile(element.contents())(scope);
                scope.initialData = angular.copy(scope.freetypeData);
            });

            // methods to control freetype functionality from outside the directive
            scope.internalControl = scope.control || {};

            // check if !dirty
            scope.internalControl.isClean = function() {
                return angular.equals(scope.freetypeData, scope.initialData);
            };
            scope.internalControl.isValid = function() {
                const isFreetypeValid = _.reduce(scope.validation, (memo, val) => memo && val, true);

                return isFreetypeValid;
            };
            function recursiveClean(obj) {
                for (const key in obj) {
                    if (angular.isObject(obj[key])) {
                        // keep only the first item in the array
                        if (angular.isArray(obj[key])) {
                            obj[key].splice(1);
                        }
                        recursiveClean(obj[key]);
                    } else if (angular.isString(obj[key])) {
                        obj[key] = undefined;
                    }
                }
            }

            scope.internalControl.reset = function() {
                scope.validation = {};
                recursiveClean(scope.freetypeData);
                scope.initialData = angular.copy(scope.freetypeData);

                // triggering this in case we want to achieve custom actions
                // on each freetype when resetting editor
                $rootScope.$emit('freetypeReset');
            };
        },

        scope: {
            freetype: '=',
            freetypeData: '=',
            validation: '=',
            control: '=',
        },
    };
}
