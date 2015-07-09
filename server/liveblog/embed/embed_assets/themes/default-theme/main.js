(function(angular) {
    'use strict';

    TimelineCtrl.$inject = ['$interval', 'PagesManager', 'blogs', 'config'];
    function TimelineCtrl($interval, PagesManager, blogsService, config) {

        var POSTS_PER_PAGE = 20;
        var DEFAULT_ORDER = 'editorial'; // newest_first, oldest_first or editorial
        var UPDATE_EVERY = 10*1000; // retrieve update interval in millisecond
        var vm = this;

        function retrieveUpdate() {
            return vm.pagesManager.retrieveUpdate(true);
        }

        // define view model
        angular.extend(vm, {
            templateDir: config.assets_root,
            blog: config.blog,
            loading: true,
            finished: false,
            order: DEFAULT_ORDER,
            orderBy: function(order_by) {
                vm.order = order_by;
                vm.loading = true;
                vm.finished = false;
                vm.pagesManager.changeOrder(order_by).then(function() {
                    vm.loading = false;
                });
            },
            fetchNewPage: function() {
                vm.loading = true;
                return vm.pagesManager.fetchNewPage().then(function(data){
                    vm.loading = false;
                    vm.finished = data._meta.total <= data._meta.max_results;
                    // TODO: notify updates
                });
            },
            isAllowedToLoadMore: function() {
                return !vm.loading && !vm.finished;
            },
            pagesManager: new PagesManager(POSTS_PER_PAGE, DEFAULT_ORDER)
        });
        // retrieve first page
        vm.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            $interval(retrieveUpdate, UPDATE_EVERY);
        });
    }

    angular.module('theme', ['liveblog-embed', 'ngAnimate', 'infinite-scroll'])
        .controller('TimelineCtrl', TimelineCtrl);
    angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 1000);

})(angular);
