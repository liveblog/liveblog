fullHeight.$inject = ['$timeout', '$window', 'lodash'];

export default function fullHeight($timeout, $window, _) {
    return {
        restrict: 'A',
        link: function($scope, $element, $attributes) {
            // update the element height to the window height minus its vertical offset
            function setHeight() {
                $timeout(() => {
                    let height = $window.innerHeight - $element.offset().top;

                    if ($attributes.fullHeightOffsetBottom) {
                        height -= $attributes.fullHeightOffsetBottom;
                    }
                    const cssName = $attributes.fullHeightUseMaxHeight ? 'max-height' : 'height';

                    $element.css(cssName, height);
                    $element[0].focus();
                });
            }
            // initialize
            setHeight();
            // update when the window size changes
            angular.element($window).on('resize', _.debounce(setHeight, 500));
            // update when offset changes
            $scope.$watch(() => $element.offset().top, _.debounce(setHeight, 500));
        },
    };
}
