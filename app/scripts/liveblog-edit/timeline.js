define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['api', '$scope', '$rootScope', 'notify', 'gettext', '$route', '$q', '$cacheFactory', 'userList'];
    function TimelineController(api, $scope, $rootScope, notify, gettext, $route, $q, $cacheFactory, userList) {
        var blog = {
            _id: $route.current.params._id
        };

        $scope.posts = {};
        $scope.noPosts = false;
        $scope.getPosts = function() {
            var callbackCreator = function(i) {
                return function(user) {
                    $scope.posts[i].original_creator_name = user.display_name;
                    if (user.picture_url) {
                        $scope.posts[i].picture_url = user.picture_url;
                    }
                };
            };
            api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', blog).query().then(function(data) {
                $scope.posts = data._items;
                //add original creator name and prepare for image
                for (var i = 0; i < $scope.posts.length; i++) {
                    var callback = callbackCreator(i);
                    userList.getUser($scope.posts[i].original_creator).then(callback);
                }

            }, function(reason) {
                notify.error(gettext('Could not load posts... please try again later'));
            });
        };
        $scope.$watch('isTimeline', function() {
            $scope.getPosts();
        });
        $scope.$watch('posts', function() {
            if ($scope.posts.length === 0) {
                $scope.noPosts = true;
            } else {
                $scope.noPosts = false;
            }
        });
    }

    var app = angular.module('liveblog.timeline', ['superdesk.users'])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {
            type: 'http',
            backend: {rel: 'blogs/<:blog_id>/posts'}
        });
        apiProvider.api('users', {
            type: 'http',
            backend: {rel: 'users'}
        });
    }]).controller('TimelineController', TimelineController)
    .directive('lbTimelineItem', ['api', 'notify', 'gettext', 'asset', function(api, notify, gettext, asset) {
        return {
            scope: {
                post: '='
            },
            replace: true,
            restrict: 'E',
            templateUrl: 'scripts/liveblog-edit/views/timeline-item.html',
            link: function(scope, elem, attrs) {}
        };
    }]);
    return app;
});
