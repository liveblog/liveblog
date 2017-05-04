syndicationController.$inject = ['$scope', '$route'];

export default function syndicationController($scope, $route) {
    $scope.states = [
        {name: 'producers', code: 'open', text: gettext('Producers')},
        {name: 'consumers', code: 'closed', text: gettext('Consumers')}
    ];

    $scope.changeState = function(state) {
        $scope.activeState = state.name;
        $route.updateParams({ state: state.name });
    };

    if ($route.current.params.hasOwnProperty('state'))
        $scope.activeState = $route.current.params.state;
    else
        $scope.changeState($scope.states[0]);
}
