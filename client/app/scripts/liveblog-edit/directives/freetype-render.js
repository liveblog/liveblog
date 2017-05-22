freetypeRender.$inject = ['$compile', 'freetypeService'];

/**
* Main directive to render the freetype editor.
*/
export default function freetypeRender($compile, freetypeService) {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
            scope.$watch('freetype', function(freetype) {
                element.html(freetypeService.transform(freetype.template, scope));
                $compile(element.contents())(scope);
                scope.initialData = angular.copy(scope.freetypeData);
            });

            //methods to control freetype functionality from outside the directive
            scope.internalControl = scope.control || {};

            //check if !dirty
            scope.internalControl.isClean = function() {
                return angular.equals(scope.freetypeData, scope.initialData);
            };
            scope.internalControl.isValid = function() {
                var isInvalid = _.reduce(scope.validation, function(memo, val) {
                        return memo && val;
                }, true);
                return !isInvalid;
            }
            function recursiveClean(obj) {
                for (var key in obj) {
                    if (angular.isObject(obj[key])) {
                        //keep only the first item in the array
                        if (angular.isArray(obj[key])) {
                            obj[key].splice(1);
                        }
                        recursiveClean(obj[key]);
                    } else if (angular.isString(obj[key])) {
                        obj[key] = '';
                    }
                }
            };

            scope.internalControl.reset = function() {
                scope.validation = {};
                recursiveClean(scope.freetypeData);
                scope.initialData = angular.copy(scope.freetypeData);
            };
        },
        scope: {
            freetype: '=',
            freetypeData: '=',
            validation: '=',
            control: '='
        }
    };
}

