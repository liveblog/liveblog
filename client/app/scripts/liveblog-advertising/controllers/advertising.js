LiveblogAdvertisingController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext',
'$q', '$sce', 'config', 'lodash', 'upload', 'blogService', 'modal', '$templateCache'];

export default function LiveblogAdvertisingController($scope, api, $location, notify, gettext,
$q, $sce, config, _, upload, blogService, modal, $templateCache) {
    var vm = this;
    $scope.activeState = 'adverts';
    $scope.changeState = function(state) {
        $scope.activeState = state;
    }
}