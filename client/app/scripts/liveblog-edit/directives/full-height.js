fullHeight.$inject = ['$timeout', '$window', 'lodash'];

export default function fullHeight($timeout, $window, _) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attributes) {
            // update the element height to the window height minus its vertical offset
            function setHeight() {
                $timeout(function() {
                    var height = $window.innerHeight - $element.offset().top;
                    if ($attributes.fullHeightOffsetBottom) {
                        height -= $attributes.fullHeightOffsetBottom;
                    }
                    var css_name = $attributes.fullHeightUseMaxHeight ? 'max-height' : 'height';
                    $element.css(css_name, height);
                    $element[0].focus();
                });
            }
            // initialize
            setHeight();
            // update when the window size changes
            angular.element($window).on('resize', _.debounce(setHeight, 500));
            // update when offset changes
            $scope.$watch(function() {
                return $element.offset().top;
            }, _.debounce(setHeight, 500));
        }
    };
}
