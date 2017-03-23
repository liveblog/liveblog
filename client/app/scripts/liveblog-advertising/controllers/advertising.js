import adsLocalTpl from 'scripts/liveblog-edit/views/ads-local.html';
import adsRemoteTpl from 'scripts/liveblog-edit/views/ads-remote.html';

LiveblogAdvertisingController.$inject = ['$scope', 'api', 'notify', 'gettext',
'upload','$templateCache', 'freetypeService', 'modal'];

export default function LiveblogAdvertisingController($scope, api, notify, gettext,
upload, $templateCache, freetypeService, modal) {
    $scope.activeState = 'adverts';
    $scope.advertType = '';
    $scope.advert = {};
    $scope.collection = {};
    $scope.advertModalActive = false;
    $scope.dialogAdvertLoading = false;
    $scope.dialogCollectionLoading = false;
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
        switch(state) {
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
    	var silent = silent || false;
        !silent ? $scope.advertsLoading = true : $scope.advertsLoading = false;
        api('advertisements').query({where: {deleted: false}}).then(function(data) {
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
        loadAdverts();
    }

    function handleAdvertSaveError() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
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
                handleAdvertSaveSuccess();
            }, function(data) {
                handleAdvertSaveError();
            });
        } else {
            api('advertisements').save(newAd).then(function(data) {
                handleAdvertSaveSuccess();
            }, function(data) {
                handleAdvertSaveError();
            });
        }
    }

    loadAdverts();



    //COLLECTIONS
    function loadCollections() {
        $scope.collectionsLoading = true;
        var criteria = {
        	where: {
        		deleted: false
        	}
        }
        var criteria = {};
        api('collections').query().then(function(data) {
            $scope.collections = data._items;
	        notify.info('Collections loaded');
            $scope.collectionsLoading = false;
            console.log('collections ', $scope.collections);
        }, function(data) {
            $scope.collectionsLoading = false;
            notify.error(gettext('There was an error getting the adverts'));
        })
    }

    function handleCollectionSaveSuccess() {
        notify.info(gettext('Collection saved successfully'));
        $scope.collection = {};
        $scope.collectionModalActive = false;
        $scope.dialogCollectionLoading = false;
        loadCollections();
    }

    function handleAdvertSaveError() {
        notify.error(gettext('Something went wrong, please try again later!'), 5000)
    }

    $scope.openCollectionDialog = function(collection) {
    	// load all available adverts without showing any messages
    	loadAdverts(true);
    	var collection = collection || false;
        if (collection) {
            // editing collection
            $scope.collection = angular.copy(collection);
            $scope.collection.checkAdverts = [];
            //console.log('$scope.collection ', $scope.collection);
            angular.forEach($scope.adverts, function(advert) {
                if ($scope.collectionHasAdvert($scope.collection, advert)) {
                    $scope.collection.checkAdverts[advert._id] = true;
                } else {
                    $scope.collection.checkAdverts[advert._id] = true;
                }
            });
            console.log('$scope.collection.checkAdverts[advert._id] ', $scope.collection.checkAdverts);
        } else {
            $scope.collection = {};
            // for checkboxes and advert collections
            $scope.collection.checkAdverts = [];
            angular.forEach($scope.adverts, function(advert) {
            	$scope.checkAdverts[advert._id] = false;
            });
        }
        $scope.collectionModalActive = true;
    }

    $scope.saveCollection = function() {
    	//create the saveable advertisement array for the collection
    	var advertisements = [];
    	angular.forEach($scope.collection.checkAdverts, function(checked, ad_id) {
    		if (checked) {
    			advertisements.push({'advertisement_id': ad_id});
    		}
    	});
        var newCollection = {
            'name': $scope.collection.name,
            'advertisements': advertisements
        }
        $scope.dialogCollectionLoading = true;

        if ($scope.collection._id) {
            // we are editing existing collection
            api('collections').save($scope.collection, newCollection).then(function(data) {
                handleCollectionSaveSuccess();
            }, function(data) {
                handleCollectionSaveError();
            });
        } else {
            api('collections').save(newCollection).then(function(data) {
                handleCollectionSaveSuccess();
            }, function(data) {
                handleCollectionSaveError();
            });
        }
    }

    $scope.removeCollection = function (collection, $index) {
        modal.confirm(gettext('Are you sure you want to remove this collection?')).then(function() {
            api('collections').save(collection, {deleted: true}).then(function(data) {
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
        var hasAdvert = false;
        angular.forEach(collection.advertisements, function(ad) {
            if (ad.advertisement_id === advert._id) {
                hasAdvert = true;
            }
        })
        return hasAdvert;
    }
}
