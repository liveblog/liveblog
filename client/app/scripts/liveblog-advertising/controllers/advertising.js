import adsLocalTpl from 'scripts/liveblog-edit/views/ads-local.html';
import adsRemoteTpl from 'scripts/liveblog-edit/views/ads-remote.html';

LiveblogAdvertisingController.$inject = ['$scope', 'api', 'notify', 'gettext',
'upload','$templateCache', 'freetypeService', 'modal'];

export default function LiveblogAdvertisingController($scope, api, notify, gettext,
upload, $templateCache, freetypeService, modal) {
    $scope.activeState = 'adverts';
    $scope.advertType = '';
    $scope.advert = {};
    $scope.advertModalActive = false;
    $scope.dialogAdvertLoading = false;
    $scope.advertsLoading = false;


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
    $scope.openAdvertDialog = function(ad) {
        if (ad._id) {
            // editing advert
            $scope.advert = angular.copy(ad);
            angular.forEach($scope.adTypes, function(adType) {
                if (adType.name === ad.type) {
                    $scope.advertType = adType;
                }
            });
            $scope.freetypesData = angular.copy(ad.meta.data);
        } else {
            $scope.advert = {};
            $scope.advertType = ad;
        }
        $scope.advertModalActive = true;
    }
    $scope.cancelAdvertCreate = function() {
        $scope.freetypeControl.reset();
        $scope.advertModalActive = false;
    }

    function loadAdverts() {
        $scope.advertsLoading = true;
        api('advertisements').query({not: {term: {deleted: true}}}).then(function(data) {
            $scope.adverts = data._items;
            notify.info('Adverts loaded');
            $scope.advertsLoading = false;
        }, function(data) {
            $scope.advertsLoading = false;
            notify.error(gettext('There was an error getting the adverts'));
        })
    }

    function handleSaveSuccess() {
        notify.info(gettext('Advert saved successfully'));
        $scope.freetypeControl.reset();
        $scope.advertModalActive = false;
        $scope.dialogAdvertLoading = false;
        loadAdverts();
    }

    $scope.removeAdvert = function (advert, $index) {
        modal.confirm(gettext('Are you sure you want to remove this advert?')).then(function() {
            api('advertisements').save(advert, {deleted: true}).then(function(data) {
                $scope.adverts.splice($index, 1);
            }, function(data) {
                notify.error(gettext('Can\'t remove advert'));
            });
        });
    }

    function handleSaveError() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
    }

    $scope.saveAdvert = function() {
        var newAd = {
            name: $scope.advert.name,
            type: $scope.advertType.name,
            text: freetypeService.htmlContent($scope.advertType.template, $scope.freetypesData),
            meta: {data: $scope.freetypesData}
        }
        $scope.dialogAdvertLoading = true;

        if ($scope.advert._id) {
            // we are editing existing ad
            api('advertisements').save($scope.advert, newAd).then(function(data) {
                handleSaveSuccess();
            }, function(data) {
                handleSaveError();
            });
        } else {
            api('advertisements').save(newAd).then(function(data) {
                handleSaveSuccess();
            }, function(data) {
                handleSaveError();
            });
        }
    }

    loadAdverts();
}
