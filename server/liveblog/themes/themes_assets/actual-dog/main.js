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
            pagesManager: new PagesManager(50)
        });
        // retrieve blog information
        // blogsService.get().$promise.then(function(blog) {
        //     vm.blog = blog;
        // });
        // retrieve first page
        vm.pagesManager.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            $interval(retrieveUpdate, 10000);
        });
    }

    angular.module('chat', ['liveblog-embed', 'ngSanitize' ,'ngAnimate'])
        .controller('TimelineCtrl', TimelineCtrl);

})(angular);
