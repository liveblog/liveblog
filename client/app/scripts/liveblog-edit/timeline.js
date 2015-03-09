/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['api', '$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', '$cacheFactory', 'userList', 'itemsService', 'postsService'];
    function TimelineController(api, $scope, $rootScope, notify, gettext,
                                 $route, $q, $cacheFactory, userList, itemsService, postsService) {

        function retrievePosts() {
            postsService.getPosts($route.current.params._id, $scope.postsCriteria).then(function(posts) {
                posts.forEach(function(post) {
                    post.show_all = false;
                    itemsService.clearExtraItems(post._id);
                    for (var i = 0, ref; i < post.groups[1].refs.length; i ++) {
                        ref = post.groups[1].refs[i];
                        if (i === 0) {
                            post.mainItem = ref;
                            continue;
                        }
                        itemsService.addExtraItem(post._id, ref);
                    }
                });
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
    .factory('itemsService', ['api', '$q', 'notify', 'gettext', function(api, $q, notify, gettext) {
        var service = {};
        service.posts = [];
        service.removeItem = function(item) {
            var deferred = $q.defer();
            item._links = {
                self: {
                    href: ''
                }
            };
            item._links.self.href = '/items/' + item._id;
            api.items.remove(item).then(function() {
                deferred.resolve('removing done');
            }, function() {
                deferred.reject('something went wrong');
            });
            return deferred.promise;
        };
        service.clearExtraItems = function(post_id) {
            if (this.posts[post_id]) {
                this.posts[post_id] = [];
            }
        };
        service.addExtraItem = function(post_id, item) {
            if (!this.posts[post_id]) {
                this.posts[post_id] = [];
            }
            this.posts[post_id].push(item);
        };
        service.getExtraItems = function(post_id) {
            return this.posts[post_id];
        };
        return service;
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
    .directive('lbTimelineItem', ['api', 'notify', 'gettext', 'asset', 'itemsService', function(api, notify, gettext, asset, itemsService) {
        return {
            scope: {
                post: '=',
                remove: '&'
            },
            replace: true,
            restrict: 'E',
            templateUrl: 'scripts/liveblog-edit/views/timeline-item.html',
            link: function(scope, elem, attrs) {
                scope.shortText = '';
                scope.isCollapsed = false;
                scope.needCollaped = false;
                scope.toggleCollapsed = function() {
                    scope.isCollapsed = !scope.isCollapsed;
                };
                scope.toggleMultipleItems = function() {
                    scope.post.show_all = !scope.post.show_all;
                    if (scope.post.show_all) {
                        //create the items array
                        if (!scope.post.items) {
                            scope.post.items = [];
                            scope.post.items.push(scope.post.mainItem);
                            var extraItems = itemsService.getExtraItems(scope.post._id);
                            for (var j = 0; j < extraItems.length; j++) {
                                scope.post.items.push(extraItems[j]);
                            }
                        }
                    }
                };
                //only text items are collapsable
                if (scope.post.type === 'text') {
                    if (scope.post.text.length > 200) {
                        scope.shortText = scope.post.text.substr(0, 200) + ' ...';
                        scope.isCollapsed = true;
                        scope.needCollapsed = true;
                    }
                }
            }
        };
    }])

    .directive('postActions', ['api', 'notify', 'gettext', 'itemsService', 'modal',
        function(api, notify, gettext, itemsService, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                post: '=',
                removeFront: '&remove'
            },
            templateUrl: 'scripts/liveblog-edit/views/timeline-post-actions.html',
            link: function(scope, elem, attrs) {
                scope.removePost = function() {
                    var remItems = scope.post.groups[1].refs;
                    confirm().then(function() {
                        api.posts.remove(scope.post).then(function(message) {
                            notify.pop();
                            notify.info(gettext('Post removed'));
                            scope.removeFront({post: {post: scope.post}});
                            for (var i = 0, item; i < remItems.length; i ++) {
                                item = remItems[i];
                                itemsService.removeItem(item.item);
                            }
                        }, function() {
                            notify.pop();
                            notify.error(gettext('Something went wrong'));
                        });
                    });
                    function confirm() {
                        return modal.confirm(gettext('Are you sure you want to delete the post?'));
                    }
                };
            }
        };
    }])
.directive('itemRemove', ['api', 'notify', 'gettext', 'itemsService', 'modal',
        function(api, notify, gettext, itemsService, modal) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                post: '=',
                item: '=',
                removeFront: '&remove'
            },
            templateUrl: 'scripts/liveblog-edit/views/timeline-item-remove.html',
            link: function(scope, elem, attrs) {
                scope.removeItem = function(item, index) {
                    confirm().then(function() {
                        if (scope.post.items.length === 1) {
                            //remove the whole post
                            api.posts.remove(scope.post).then(function(message) {
                                notify.pop();
                                notify.info(gettext('Post removed'));
                                scope.removeFront({post: {post:scope.post}});
                                itemsService.removeItem(item.item);
                            }, function() {
                                notify.pop();
                                notify.error(gettext('Something went wrong'));
                            });

                        } else {
                            //update the post
                            //creating the update for items
                            var update = {
                                groups: []
                            };
                            update.groups = scope.post.groups;
                            scope.post.items.splice(index, 1);
                            update.groups[1].refs = scope.post.items;
                            //update the post
                            api.posts.save(scope.post, update).then(function(message) {
                                //reconsider if the post still have multiple items
                                scope.post.multiple_items = scope.post.items.length > 1 ? scope.post.items.length : false;
                                //if it the item removed was the first item in the list update main Item
                                if (index === 0) {
                                    scope.post.mainItem = scope.post.items[0];
                                }
                                itemsService.removeItem(item.item);
                                notify.pop();
                                notify.info(gettext('Item removed'));
                            }, function(erro) {
                                notify.pop();
                                notify.error(gettext('Something went wrong'));
                            });
                        }
                    });
                    function confirm() {
                        return modal.confirm(gettext('Are you sure you want to delete the item?'));
                    }
                };
            }
        };
    }])
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
