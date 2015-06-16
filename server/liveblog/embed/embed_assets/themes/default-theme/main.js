(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$interval', 'PagesManager', 'blogs', 'config'];
    function TimelineCtrl($interval, PagesManager, blogsService, config) {

        var vm = this;

        function retrieveUpdate() {
            return vm.pagesManager.retrieveUpdate(true);
        }

        // define view model
        angular.extend(vm, {
            blog: config.blog,
            showSplash: true,
            pagesManager: new PagesManager(50)
        });
        // retrieve first page
        vm.pagesManager.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            $interval(retrieveUpdate, 10000);
        });
    }

    angular.module('default-theme', ['liveblog-embed', 'ngSanitize' ,'ngAnimate'])
        .directive('lbTemplate', ['config', function(config) {
            return {
                controller: TimelineCtrl,
                controllerAs: 'timeline',
                templateUrl: config.assets_root + 'template.html'
            };
        }]);

})(angular);
