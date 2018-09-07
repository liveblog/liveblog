import freetypeLinkTpl from 'scripts/liveblog-edit/views/freetype-link.ng1';

export default function freetypeLink() {
    return {
        restrict: 'E',
        templateUrl: freetypeLinkTpl,
        controller: ['$scope', function($scope) {
            const regex = /https?:\/\/[^\s]+\.[^\s.]+/;

            $scope._id = _.uniqueId('link');
            const sentinel = $scope.$watch('link', (value) => {
                $scope.valid = !value || regex.test(value);
                $scope.validation[$scope._id] = $scope.valid;
            });

            $scope.$on('$destroy', sentinel);
        }],
        scope: {
            link: '=',
            validation: '=',
        },
    };
}
