import adsLocalTpl from 'scripts/liveblog-edit/views/ads-local.html';
import adsRemoteTpl from 'scripts/liveblog-edit/views/ads-remote.html';
import advertModalTpl from 'scripts/liveblog-advertising/views/advert-modal.html';
import collectionModalTpl from 'scripts/liveblog-advertising/views/collection-modal.html';
import _ from 'lodash';
import adblockDetect from 'adblock-detect';

LiveblogAdvertisingController.$inject = ['$scope', 'api', 'notify', 'gettext',
'upload','$templateCache', 'freetypeService', 'modal', 'adsUtilSevice'];

export default function LiveblogAdvertisingController($scope, api, notify, gettext,
upload, $templateCache, freetypeService, modal, adsUtilSevice) {
    adblockDetect(function(adblockDetected) {
        $scope.adblockDetected = adblockDetected;
    });
    $scope.activeState = 'adverts';
    $scope.advertType = '';
    $scope.advert = {};
    $scope.collection = {};
    $scope.advertModalActive = false;
    $scope.dialogAdvertLoading = false;
    $scope.dialogCollectionLoading = false;
    $scope.advertsLoading = false;
    // views for the modals
    $scope.advertModalTpl = advertModalTpl;
    $scope.collectionModalTpl = collectionModalTpl;


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
        switch (state) {
            case 'collections':
                loadCollections();
                break;
            default: 
                loadAdverts();
        }
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

    function loadAdverts(silent) {
        silent = silent || false;
        $scope.advertsLoading = !silent;
        return api('advertisements').query({where: {deleted: false}})
        .then(function(data) {
            $scope.adverts = data._items;
            if (!silent) {
                notify.info('Adverts loaded');
            }
            $scope.advertsLoading = false;
        }, function(data) {
            $scope.advertsLoading = false;
            notify.error(gettext('There was an error getting the adverts'));
        })
    }

    function handleAdvertSaveSuccess() {
        notify.info(gettext('Advert saved successfully'));
        $scope.freetypeControl.reset();
        $scope.advertModalActive = false;
        $scope.dialogAdvertLoading = false;
        return loadAdverts(true);
    }

    function handleAdvertSaveError() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
    }

    $scope.removeAdvert = function (advert, $index) {
        modal.confirm(gettext('Are you sure you want to remove this advert?')).then(function() {
            api('advertisements').save(advert, {deleted: true})
            .then(function(data) {
                $scope.adverts.splice($index, 1);
            }, function(data) {
                notify.error(gettext('Can\'t remove advert'));
            });
        });
    }

    $scope.saveAdvert = function() {
        var newAd = {
            name: $scope.advert.name,
            type: $scope.advertType.name,
            text: freetypeService.htmlContent($scope.advertType.template, $scope.freetypesData),
            meta: {data: $scope.freetypesData}
        }
        $scope.dialogAdvertLoading = true;

        api('advertisements').save($scope.advert, newAd)
        .then(handleAdvertSaveSuccess, handleAdvertSaveError);
    }

    loadAdverts();

    //COLLECTIONS
    function loadCollections(silent) {
        silent = silent || false;
        if (!silent) {
            $scope.collectionsLoading = true;
        }
        return api('collections').query({where: {deleted: false}})
        .then(function(data) {
            $scope.collections = data._items;
            if (!silent) {
                notify.info(gettext('Collections loaded'));
            }
            $scope.collectionsLoading = false;
        })
        .catch(function(data) {
            $scope.collectionsLoading = false;
            notify.error(gettext('There was an error getting the adverts'));
        })
    }

    function handleCollectionSaveSuccess() {
        notify.info(gettext('Collection saved successfully'));
        $scope.collection = {};
        $scope.collectionModalActive = false;
        $scope.dialogCollectionLoading = false;
        return loadCollections(true);
    }

    function handleCollectionSaveError() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
    }

    $scope.openCollectionDialog = function(collection) {
        collection = collection || false;
        // load all available adverts without showing any messages
        loadAdverts(true).then(function() {
            if (collection) {
                // editing collection
                $scope.collection = angular.copy(collection);
                $scope.collection.checkAdverts = {};
                //console.log('$scope.collection ', $scope.collection);
                angular.forEach($scope.adverts, function(advert) {
                    if ($scope.collectionHasAdvert($scope.collection, advert)) {
                        $scope.collection.checkAdverts[advert._id] = true;
                    } else {
                        $scope.collection.checkAdverts[advert._id] = false;
                    }
                });
            } else {
                $scope.collection = {};
                // for checkboxes and advert collections
                $scope.collection.checkAdverts = {};
                angular.forEach($scope.adverts, function(advert) {
                    $scope.collection.checkAdverts[advert._id] = false;
                });
            }
            $scope.collectionModalActive = true;
        });
    }

    $scope.saveCollection = function() {

        //create the saveable advertisement array for the collection
        var advertisements = [];
        angular.forEach($scope.collection.checkAdverts, function(checked, ad_id) {
            if (checked) {
                advertisements.push({'advertisement_id': ad_id});
            }
        })
        var newCollection = {
            'name': $scope.collection.name,
            'advertisements': advertisements
        }
        $scope.dialogCollectionLoading = true;

        api('collections').save($scope.collection, newCollection)
        .then(handleCollectionSaveSuccess, handleCollectionSaveError);
    }

    $scope.removeCollection = function (collection, $index) {
        modal.confirm(gettext('Are you sure you want to remove this collection?'))
        .then(function() {
            api('collections').save(collection, {deleted: true})
            .then(function(data) {
                $scope.collections.splice($index, 1);
            }, function(data) {
                notify.error(gettext('Can\'t remove collection'));
            });
        });
    }

    $scope.cancelCollectionCreate = function() {
        $scope.collection = {};
        $scope.collectionModalActive = false;
    }

    $scope.collectionHasAdvert = function (collection, advert) {
        return !!collection.advertisements.find((ad) => ad.advertisement_id === advert._id);
    }

    $scope.notValidName = adsUtilSevice.uniqueNameInItems;

    $scope.freetypeValid = function() {
        return !Object.keys($scope.validation).find((key) => !$scope.validation[key]);
    }
}
