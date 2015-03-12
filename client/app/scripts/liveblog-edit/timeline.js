/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', '$cacheFactory', 'userList', 'postsService'];
    function TimelineController($scope, $rootScope, notify, gettext,
                                 $route, $q, $cacheFactory, userList, postsService) {

        function retrievePosts() {
            postsService.getPosts($route.current.params._id, $scope.postsCriteria).then(function(posts) {
                $scope.posts = $scope.posts.concat(posts);
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

        // set the $scope
        angular.extend($scope, {
            posts: [],
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
        // refresh the posts list when the user add a new post
        $rootScope.$on('lb.posts.updated', function() {
            // TODO: When the Post's POST reponse contains the items, we
            // will be able to use the event's parameter to update the list.
            // Before that, we reset the list and load it again
            $scope.posts = [];
            retrievePosts();
        });
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
        return {
            restrict: 'A',
            link: function(scope, elem, attrs) {
                var w = angular.element($window);
                scope.getWindowHeight = function () {
                    return w.height();
                };
                scope.$watch(scope.getWindowHeight, function (newHeight) {
                    elem.height(newHeight - 220);
                });
                w.bind('resize', function() {
                    scope.$apply();
                });
            }
        };
    }]);
    return app;
});
