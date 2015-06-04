(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$interval', 'PagesManager', 'blogs'];
    function TimelineCtrl($interval, PagesManager, blogsService) {

        var vm = this;

        function retrieveUpdate(force_sync) {
            force_sync = vm.autoUpdate || force_sync === true;
            return vm.pagesManager.retrieveUpdate(force_sync).then(function(posts) {
                // save updates meta data
                vm.updatesAvailable = posts._meta.total;
            });
        }

        // define view model
        angular.extend(vm, {
            autoUpdate: false,
            blog: {},
            pagesManager: new PagesManager(5),
            updatesAvailable: 0,
            retrieveUpdate: retrieveUpdate
        });
        // retrieve blog information
        blogsService.get().$promise.then(function(blog) {
            vm.blog = blog;
        });
        // retrieve first page
        vm.pagesManager.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            $interval(retrieveUpdate, 10000);
        });
    }

    angular.module('liveblog.default-theme', ['liveblog-embed', 'ngSanitize' ,'ngAnimate'])
        .directive('lbTemplate', function() {
            return {
                controller: TimelineCtrl,
                controllerAs: 'timeline',
                templateUrl: window.LB_ASSETS_DIR+'/default-theme/default-theme-template.html'
            };
        });

})(angular);
