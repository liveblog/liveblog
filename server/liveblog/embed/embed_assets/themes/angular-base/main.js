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
            initTwitter: function(element_id) {
                window.twttr = (function(d, s, id) {
                    var js, fjs = d.getElementsByTagName(s)[0],t = window.twttr || {};
                    if (d.getElementById(id)) return t; js = d.createElement(s);js.id = id;
                    js.src = "https://platform.twitter.com/widgets.js";
                    fjs.parentNode.insertBefore(js, fjs); t._e = [];
                    t.ready = function(f) {t._e.push(f);}; return t;}(document, "script", "twitter-wjs"));
                    window.twttr.ready(function(){
                        window.twttr.widgets.load(document.getElementById(element_id));
                    });
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
        .controller('TimelineCtrl', TimelineCtrl)
        .filter('date', function() {
            return function(input) {
                var date = fecha.parse(input, 'YYYY-MM-DDTHH:mm:ss+0000');
                return fecha.format(date, 'DD/MM/YYYY  HH:mm');
            };
        });
    angular.module('infinite-scroll').value('THROTTLE_MILLISECONDS', 1000);

})(angular);
