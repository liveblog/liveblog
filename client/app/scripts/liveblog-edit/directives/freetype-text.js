import freetypeTextTpl from 'scripts/liveblog-edit/views/freetype-text.ng1';

export default function freetypeText() {
    return {
        restrict: 'E',
        templateUrl: freetypeTextTpl,
        link: function($scope, element) {
            element.on('$destroy', () => {
                $scope.cleanUp();
            });
        },
        controller: ['$scope', '$rootScope', '$attrs', function($scope, $rootScope, $attrs) {
            $scope._id = _.uniqueId('text');
            if ($scope.initial !== undefined && $scope.text === '') {
                $scope.text = String($scope.initial);
            }

            if ($attrs.number !== undefined) {
                $scope.$on('$destroy', $scope.$watch('text', (value) => {
                    if (value === undefined) return;
                    $scope.numberFlag = (value !== '') && isNaN(value);
                    $scope.validation['number__' + $scope._id] = !$scope.numberFlag;
                }, true));
            }

            if ($attrs.compulsory !== undefined) {
                $scope.$on('$destroy', $scope.$watch('[text,compulsory]', ([text, compulsory]) => {
                    // if initially they're undefined we return and do nothing
                    if (text === undefined && compulsory === undefined) return;

                    $scope.compulsoryFlag = (text === '' && (compulsory === '' || compulsory === undefined));
                    $scope.validation['compulsory__' + $scope._id] = !$scope.compulsoryFlag;
                }, true));
            }

            if ($attrs.tandem !== undefined) {
                $scope.$on('$destroy', $scope.$watch('[text,tandem]', (value) => {
                    $scope.tandemFlag = (value[0] === '' && value[1] !== '');
                    $scope.validation['tandem__' + $scope._id] = !$scope.tandemFlag;
                }, true));
            }

            if ($attrs.necessary !== undefined) {
                $scope.$on('$destroy', $scope.$watch('text', (value) => {
                    $scope.necessaryFlag = (value === '') || (value === undefined);
                    $scope.validation['necessary__' + $scope._id] = !$scope.necessaryFlag;
                }, true));
            }

            // listen to event in order to destroy scope and avoid garbage
            $rootScope.$on('freetypeScopeDestroy', () => {
                $scope.$destroy();
            });

            $rootScope.$on('freetypeReset', () => {
                $scope.cleanUp();
            });

            $scope.cleanUp = function() {
                const prefixes = ['number', 'compulsory', 'tandem', 'necessary'];

                // when the element is detroyed, we should avoid keeping garbage in scope
                prefixes.forEach((prefix) => {
                    delete $scope.validation[`${prefix}__${$scope._id}`];

                    // also let's reset flags
                    $scope[`${prefix}Flag`] = undefined;
                });
            };
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
