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
            initTwitter: function() {
                window.twttr = (function(d, s, id) {
                    var js, fjs = d.getElementsByTagName(s)[0],t = window.twttr || {};
                    if (d.getElementById(id)) return t; js = d.createElement(s);js.id = id;
                    js.src = "https://platform.twitter.com/widgets.js";
                    fjs.parentNode.insertBefore(js, fjs); t._e = [];
                    t.ready = function(f) {t._e.push(f);}; return t;}(document, "script", "twitter-wjs"));
            },
            pagesManager: new PagesManager(50)
        });
        // retrieve first page
        vm.pagesManager.fetchNewPage()
        // retrieve updates periodically
        .then(function() {
            $interval(retrieveUpdate, 10000);
        });
    }

    angular.module('default-theme', ['liveblog-embed', 'ngAnimate'])
        .directive('lbTemplate', ['config', function(config) {
            return {
                controller: TimelineCtrl,
                controllerAs: 'timeline',
                templateUrl: config.assets_root + 'template.html'
            };
        }]);

})(angular);
