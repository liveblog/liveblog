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
        'notify', 'gettext', 'asset', 'postsService', 'modal',
        function(notify, gettext, asset, postsService, modal) {
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
    }])
    .directive('lbSimpleEdit', ['api', 'notify', 'gettext', function(api, notify, gettext) {
        var config = {
            buttons: ['bold', 'italic', 'underline', 'quote'],
            placeholder: ''
        };
        return {
            scope: {
                seItem: '='
            },
            priority: 0,
            templateUrl: 'scripts/liveblog-edit/views/quick-edit-buttons.html',
            link: function(scope, elem, attrs) {
                scope.showButtonsSwitch = false;
                scope.origContent = '';
                var editbl = elem.find('[medium-editable]');
                new window.MediumEditor(editbl, config);

                editbl.on('focus', function() {
                    //save a copy of the original content
                    scope.origContent = editbl.html();
                    scope.showButtons();
                });
                scope.showButtons = function() {
                    scope.showButtonsSwitch = true;
                    scope.$apply();
                };
                scope.hideButtons = function() {
                    scope.showButtonsSwitch = false;
                };
                scope.$watch('showButtons', function() {
                    //save a version o the unnodified text
                    scope.originalText = elem.html();
                });
                scope.cancelMedium = function() {
                    //restore the text to original
                    editbl.html(scope.origContent);
                    scope.hideButtons();
                };
                scope.updateMedium = function() {
                    scope.seItem._links = {
                        self: {
                            href: ''
                        }
                    };
                    scope.seItem._links.self.href = '/items/' + scope.seItem._id;
                    notify.info(gettext('Updating post'));
                    var textModif = editbl.html();
                    api.items.save(scope.seItem, {text: textModif}).then(function() {
                        notify.pop();
                        notify.info(gettext('Item updated'));
                        scope.hideButtons();
                    }, function() {
                        notify.pop();
                        notify.info(gettext('Something went wrong. Please try again later'));
                    });
                };
            }
        };
    }]);
    return app;
});
