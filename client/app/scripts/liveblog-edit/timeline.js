/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', '$cacheFactory', 'userList', 'postsService',
                                'blogService'];
    function TimelineController($scope, $rootScope, notify, gettext,
                                 $route, $q, $cacheFactory, userList, postsService,
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
    .directive('rollshow', [function() {
        return {
            link: function(scope, elem, attrs) {
                elem.parent().on('mouseover', function() {
                    elem.show();
                });
                elem.parent().on('mouseout', function() {
                    elem.hide();
                });
            }
        };
    }])
    .directive('lbTimelinePost', [
        'notify', 'gettext', 'asset', 'postsService', 'modal', 'blogService',
        function(notify, gettext, asset, postsService, modal, blogService) {
            return {
                scope: {
                    post: '=',
                    onEditClick: '='
                },
                replace: true,
                restrict: 'E',
                templateUrl: 'scripts/liveblog-edit/views/timeline-post.html',
                link: function(scope, elem, attrs) {
                    scope.toggleMultipleItems = function() {
                        scope.post.show_all = !scope.post.show_all;
                    };

                    scope.removePost = function(post) {
                        postsService.remove(post).then(function(message) {
                            notify.pop();
                            notify.info(gettext('Post removed'));
                        }, function() {
                            notify.pop();
                            notify.error(gettext('Something went wrong'));
                        });
                    };

                    scope.askRemovePost = function(post) {
                        modal.confirm(gettext('Are you sure you want to delete the post?'))
                            .then(function() {
                                scope.removePost(post);
                            });
                    };

                    scope.askRemoveItem = function(item, post) {
                        modal.confirm(gettext('Are you sure you want to delete the item?'))
                            .then(function() {
                                if (scope.post.items.length === 1) {
                                    scope.removePost(post);
                                } else {
                                    //update the post
                                    //creating the update for items
                                    var items = angular.copy(scope.post.items);
                                    var index = scope.post.items.indexOf(item);
                                    items.splice(index, 1);
                                    //update the post
                                    postsService.savePost(scope.post.blog, scope.post, items)
                                        .then(function(message) {
                                            notify.pop();
                                            notify.info(gettext('Item removed'));
                                        }, function(erro) {
                                            notify.pop();
                                            notify.error(gettext('Something went wrong'));
                                        });
                                }
                            }
                        );
                    };
                }
            };
        }
    ])
    .directive('lbBindHtml', [function() {
        return {
            restrict: 'A',
            priority: 2,
            link: function(scope, elem, attrs) {
                attrs.$observe('htmlContent', function() {
                    if (attrs.htmlLocation) {
                        //need to inject the html in a specific element
                        elem.find('[' + attrs.htmlLocation + ']').html(attrs.htmlContent);
                    } else {
                        //inject streaght in the elem
                        elem.html(attrs.htmlContent);
                    }
                });
            }
        };
    }])
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
