/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';

    var app = angular.module('liveblog.timeline', ['superdesk.users', 'liveblog.edit', 'lrInfiniteScroll'])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {
            type: 'http',
            backend: {rel: 'blogs/<:blog_id>/posts'}
        });
    }])
    .directive('setTimelineHeight', ['$window', function($window) {
        var w = angular.element($window);
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var updateElementHeight = function () {
                    elem.css('height', w.height() - elem.offset().top);
                };
                updateElementHeight();
                w.on('resize', updateElementHeight);
                elem.on('$destroy', function cleanupOnDestroy() {
                    w.off('resize', updateElementHeight);
                });
            }
        };
    }]);
    return app;
});
