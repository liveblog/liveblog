(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$resource', '$interval', '$q', 'PagesManager', 'posts', 'blogs'];
    function TimelineCtrl($resource, $interval, $q, PagesManager, posts, blogs) {

        var vm = this;

        function retrieveUpdate(force_sync) {
            force_sync = vm.auto_update || force_sync === true;
            return vm.pagesManager.retrieveUpdate(force_sync).then(function(posts) {
                // save updates meta data
                vm.updates_available = posts._meta.total;
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
        // retrieve first page
        vm.pagesManager.fetchNewPage()
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
