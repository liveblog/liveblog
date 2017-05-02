import freetypeLinkTpl from 'scripts/liveblog-edit/views/freetype-link.html';

export default function freetypeLink() {
    return {
        restrict: 'E',
        templateUrl: freetypeLinkTpl,
        controller: ['$scope', function($scope) {
            var regex = /https?:\/\/[^\s]+\.[^\s\.]+/;
            $scope._id = _.uniqueId('link');
            var sentinel = $scope.$watch('link', function(value) {
                $scope.valid = !value || regex.test(value);
                $scope.validation[$scope._id] = $scope.valid;
            });
            $scope.$on('$destroy', sentinel);
        }],
        scope: {
            link: '=',
            validation: '='
        }
    };
}
