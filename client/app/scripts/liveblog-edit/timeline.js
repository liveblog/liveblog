/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', 'userList', 'postsService',
                                'blogService'];
    function TimelineController($scope, $rootScope, notify, gettext,
                                 $route, $q, userList, postsService,
                                 blogService) {

        function retrievePosts() {
            $scope.timelineLoading = true;
            postsService.fetchPosts(
                $route.current.params._id,
                'open',
                $scope.postsCriteria,
                $scope.posts,
                $scope.postsInfo
            ).then(function(data) {
                $scope.timelineLoading = false;
            }, function(reason) {
                notify.error(gettext('Could not load posts... please try again later'));
                $scope.timelineLoading = false;
            });
        }

        function retrieveOneMorePageOfPosts() {
            //check if we still have posts to load
            if ($scope.totalPosts > ($scope.postsCriteria.page  * $scope.postsCriteria.max_results)) {
                $scope.postsCriteria.page ++;
                retrievePosts();
            }
        }
        $scope.$on('posts', function() {
            postsService.updatePosts($route.current.params._id, 'open', $scope.posts, $scope.postsInfo);
        });
        $scope.$on('items', function() {
            postsService.updateItems($route.current.params._id, $scope.posts, $scope.postsInfo);
        });
        $scope.$on('blogs', function() {
            blogService.update($route.current.params._id);
        });
        // set the $scope
        angular.extend($scope, {
            posts: [],
            postsInfo: {},
            timelineLoading: false,
            postsCriteria: {
                max_results: 10,
                page: 1
            },
            loadMore: retrieveOneMorePageOfPosts,
            isPostsEmpty: function() {
                return $scope.posts.length === 0 && !$scope.timelineLoading;
            },
            removeFromPosts: postsService.remove
        });
        // load posts
        retrievePosts();
    }

    var app = angular.module('liveblog.timeline', ['superdesk.users', 'liveblog.edit', 'lrInfiniteScroll'])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {
            type: 'http',
            backend: {rel: 'blogs/<:blog_id>/posts'}
        });
        apiProvider.api('users', {
            type: 'http',
            backend: {rel: 'users'}
        });
        apiProvider.api('posts', {
            type: 'http',
            backend: {rel: 'posts'}
        });
        apiProvider.api('items', {
            type: 'http',
            backend: {rel: 'items'}
        });
    }])
    .controller('TimelineController', TimelineController)
    .directive('setTimelineHeight', ['$window', function($window) {
        var offset = 40; // 20px padding top and bottom
        var w = angular.element($window);
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var updateElementHeight = function () {
                    elem.css('height', w.height() - elem.offset().top - offset);
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
