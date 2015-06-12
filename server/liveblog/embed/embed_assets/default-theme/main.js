(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$interval', 'PagesManager', 'blogs'];
    function TimelineCtrl($interval, PagesManager, blogsService) {

        var vm = this;

        function retrieveUpdate() {
            return vm.pagesManager.retrieveUpdate(true);
        }

        // define view model
        angular.extend(vm, {
            blog: {},
            pagesManager: new PagesManager(5)
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
        .directive('lbTemplate', ['config', function(config) {
            return {
                controller: TimelineCtrl,
                controllerAs: 'timeline',
                templateUrl: config.assets_root + 'default-theme-template.html'
            };
        }]);

})(angular);
