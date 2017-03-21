import adsLocalTpl from 'scripts/liveblog-edit/views/ads-local.html';
import adsRemoteTpl from 'scripts/liveblog-edit/views/ads-remote.html';

LiveblogAdvertisingController.$inject = ['$scope', 'api', 'notify', 'gettext',
'upload','$templateCache', 'freetypeService'];

export default function LiveblogAdvertisingController($scope, api, notify, gettext,
upload, $templateCache, freetypeService) {
    var vm = this;
    $scope.activeState = 'adverts';
    $scope.advertType = '';
    $scope.advert = {};
    $scope.advertModalActive = false;
    $scope.dialogAdvertLoading = false;


    $scope.freetypesData = {}; $scope.freetypeControl = {}; $scope.validation = {};
    $scope.adTypes = [
    	{
            name: 'Advertisement Local',
            template: $templateCache.get(adsLocalTpl)
        },
        {
            name: 'Advertisement Remote',
            template: $templateCache.get(adsRemoteTpl)
        }
    ]

    $scope.changeState = function(state) {
        $scope.activeState = state;
    }
    $scope.createNew = function(ad) {
    	$scope.advertModalActive = true;
    	$scope.advertType = ad;
    }
    $scope.cancelAdvertCreate = function() {
    	$scope.freetypeControl.reset();
    	$scope.advertModalActive = false;
    }
    $scope.saveAdvert = function() {
    	var newAd = {
    		name: $scope.advert.name,
    		type: $scope.advertType.name,
    		text: freetypeService.htmlContent($scope.advertType.template, $scope.freetypesData),
    		meta: {data: $scope.freetypesData}
    	}
    	console.log(newAd);
    }
}