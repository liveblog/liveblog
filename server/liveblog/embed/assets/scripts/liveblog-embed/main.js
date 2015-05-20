(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$resource', '$interval', '$q', 'PagesManager', 'posts', 'blogs'];
    function TimelineCtrl($resource, $interval, $q, PagesManager, posts, blogs) {

        var vm = this;

        function retrieveUpdate(force_sync) {
            return vm.pagesManager.retrieveUpdate().then(function(posts) {
                // save updates meta data
                vm.updates_available = posts._meta.total;
                // process the sync operation
                force_sync = force_sync === true;
                if (force_sync || vm.auto_update) {
                    vm.pagesManager.applyUpdates(posts._items);
                }
                return posts;
            });
        }

        // define vm
        angular.extend(vm, {
            auto_update: false,
            blog: {},
            pagesManager: new PagesManager(5),
            updates_available: 0,
            retrieveUpdate: retrieveUpdate
        });
        // retrieve blog information
        blogs.get().$promise.then(function(blog) {
            vm.blog = blog;
        });
        // retrieve updates just to know the latest date
        vm.pagesManager.retrieveUpdate().then(function(updates) {
            vm.pagesManager.updateLatestDates(updates._items);
        })
        // retrieve first page
        .then(vm.pagesManager.fetchNewPage)
        // retrieve updates periodically
        .then(function() {
            $interval(retrieveUpdate, 2000);
        });
    }

    angular.module('liveblog-embed', ['ngResource', 'ngSanitize' ,'ngAnimate'])
        .config(['$interpolateProvider', function($interpolateProvider) {
            // change the template tag symbols
            $interpolateProvider.startSymbol('[[').endSymbol(']]');
        }])
        .controller('timelineCtrl', TimelineCtrl);

})(angular);
