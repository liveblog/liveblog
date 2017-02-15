liveblogSyndication
    .controller('SyndicationController', ['$scope', function($scope) {
        $scope.states = [
            {name: 'producers', code: 'open', text: gettext('Producers')},
            {name: 'consumers', code: 'closed', text: gettext('Consumers')}
        ];
    }]);
