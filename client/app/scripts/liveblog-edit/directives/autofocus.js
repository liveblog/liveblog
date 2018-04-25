autofocus.$inject = ['$timeout'];

export default function autofocus($timeout) {
    return {
        restrict: 'A',
        link: function($scope, $element) {
            $timeout(() => {
                $element[0].focus();
            });
        },
    };
}
