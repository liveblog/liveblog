/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['api', '$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', '$cacheFactory', 'userList', 'itemsService'];
    function TimelineController(api, $scope, $rootScope, notify, gettext,
                                 $route, $q, $cacheFactory, userList, itemsService) {
        var blog = {
            _id: $route.current.params._id
        };
        $scope.posts = [];
        $scope.totalPosts = 0;
        $scope.timelineLoading = false;
        $scope.isPostsEmpty = function() {
            return $scope.posts.length === 0 && !$scope.timelineLoading;
        };
        $scope.postsCriteria = {
            max_results: 10,
            page: 1
        };
        function callbackCreator (i) {
            return function(user) {
                $scope.posts[i].original_creator_name = user.display_name;
                if (user.picture_url) {
                    $scope.posts[i].picture_url = user.picture_url;
                }
            };
        }
        $scope.getPosts = function() {
            $scope.timelineLoading = true;
            api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', blog).query($scope.postsCriteria).then(function(data) {
                $scope.totalPosts = data._meta.total;
                //$scope.posts = _.map(data._items, function(post) {
                for (var j = 0, post = {}; j < data._items.length; j ++) {

                    //build the new post system
                    post = data._items[j];
                    post.show_all = false;
                    post.multiple_items = post.groups[1].refs.length > 1 ? post.groups[1].refs.length : false;
                    if (!post.multiple_items) {
                        post.items = [];
                        post.items.push(post.groups[1].refs[0]);
                    }
                    itemsService.clearExtraItems(post._id);
                    for (var i = 0, ref; i < post.groups[1].refs.length; i ++) {
                        ref = post.groups[1].refs[i];
                        if (i === 0) {
                            post.mainItem = ref;
                            continue;
                        }
                        itemsService.addExtraItem(post._id, ref);
                    }
                    $scope.posts.push(post);
                }
                //add original creator name and prepare for image

                for (var k = (($scope.postsCriteria.page - 1) * $scope.postsCriteria.max_results); k < $scope.posts.length; k ++) {
                    var callback = callbackCreator(k);
                    userList.getUser($scope.posts[k].original_creator).then(callback);
                }
                $scope.timelineLoading = false;
            }, function(reason) {
                notify.error(gettext('Could not load posts... please try again later'));
                $scope.timelineLoading = false;
            });
        };
        $scope.loadMore = function() {
            //check if we still have posts to load
            if ($scope.totalPosts > ($scope.postsCriteria.page  * $scope.postsCriteria.max_results)) {
                $scope.postsCriteria.page ++;
                $scope.getPosts();
            } else {
                return;
            }
        };
        //remove the item from the list as a stopgap until update works
        $scope.removeFromPosts = function(post) {
            $scope.posts.splice($scope.posts.indexOf(post), 1);
        };
        // refresh the posts list when the user arrives on the timeline
        $scope.$watch('isTimeline', function() {
            //set paging back to number 1
            $scope.postsCriteria.page = 1;
            $scope.getPosts();
        });
        // refresh the posts list when the user add a new post
        $rootScope.$on('lb.editor.postsaved', $scope.getPosts);
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
    .directive('itemActions', ['api', 'notify', 'gettext', 'asset', 'itemsService', 'modal',
        function(api, notify, gettext, asset, itemsService, modal) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'scripts/liveblog-edit/views/timeline-item-actions.html',
            link: function(scope, elem, attrs) {
                scope.removeItem = function(item, index) {
                    confirm().then(function() {
                        if (scope.post.items.length === 1) {
                            //remove the whole post
                            api.posts.remove(scope.post).then(function(message) {
                                notify.pop();
                                notify.info(gettext('Post removed'));
                                scope.remove({post:scope.post});
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
                            //remove the item from the post only after
                            var tempRef = scope.post.items;
                            tempRef.splice(index, 1);
                            update.groups[1].refs = tempRef;
                            //update the post
                            api.posts.save(scope.post, update).then(function(message) {
                                //remove item from the dom
                                scope.post.items.splice(index, 1);
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
