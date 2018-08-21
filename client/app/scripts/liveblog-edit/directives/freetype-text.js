import freetypeTextTpl from 'scripts/liveblog-edit/views/freetype-text.ng1';

export default function freetypeText() {
    return {
        restrict: 'E',
        templateUrl: freetypeTextTpl,
        controller: ['$scope', '$rootScope', function($scope, $rootScope, element) {
            $scope._id = _.uniqueId('text');
            if ($scope.initial !== undefined && $scope.text === '') {
                $scope.text = String($scope.initial);
            }

            if ($scope.number !== undefined) {
                $scope.$on('$destroy', $scope.$watch('text', (value) => {
                    if (value === undefined) return;
                    $scope.numberFlag = (value !== '') && isNaN(value);
                    $scope.validation['number__' + $scope._id] = !$scope.numberFlag;
                }, true));
            }

            if ($scope.compulsory !== undefined) {
                $scope.$on('$destroy', $scope.$watch('[text,compulsory]', (value) => {
                    $scope.compulsoryFlag = (value[0] === '' && value[1] === '');
                    $scope.validation['compulsory__' + $scope._id] = !$scope.compulsoryFlag;
                }, true));
            }

            if ($scope.tandem !== undefined) {
                $scope.$on('$destroy', $scope.$watch('[text,tandem]', (value) => {
                    $scope.tandemFlag = (value[0] === '' && value[1] !== '');
                    $scope.validation['tandem__' + $scope._id] = !$scope.tandemFlag;
                }, true));
            }

            if ($scope.necessary !== undefined) {
                $scope.$on('$destroy', $scope.$watch('text', (value) => {
                    $scope.necessaryFlag = (value === '') || (value === undefined);
                    $scope.validation['necessary__' + $scope._id] = !$scope.necessaryFlag;
                }, true));
            }

            // listen to event in order to destroy scope and avoid garbage
            $rootScope.$on('freetypeScopeDestroy', () => {
                $scope.$destroy();
            });
        }],
        scope: {
            text: '=',
            // `compulsory` indicates a variable that is needed if the current value is empty.
            compulsory: '=',
            // `necessary` indicates is a variable needs to be non empty.
            necessary: '=',
            // `tandem` indicates a variable that is also needed.
            tandem: '=',
            validation: '=',
            number: '@',
            order: '@',
            initial: '@',
            // pass on the maxlength attribute to the input
            maxlength: '@',
        },
    };
}
