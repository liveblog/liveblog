/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['api', '$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', '$cacheFactory', 'userList', 'publishCounter', 'itemsService', '$timeout'];
    function TimelineController(api, $scope, $rootScope, notify, gettext,
                                 $route, $q, $cacheFactory, userList, publishCounter, itemsService, $timeout) {
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
                $scope.posts = _.map(data._items, function(post) {
                    //build the new post system
                    post.show_all = false;
                    post.multiple_items = post.groups[1].refs.length > 1 ? post.groups[1].refs.length : false;
                    for (var i = 0, ref; i < post.groups[1].refs.length; i ++) {
                        ref = post.groups[1].refs[i];
                        if (i === 0) {
                            post.mainItem = ref.item;
                            continue;
                        }
                        itemsService.addExtraItem(post._id, ref.item);
                    }
                    return post;
                });
                //add original creator name and prepare for image
                for (var i = 0; i < $scope.posts.length; i++) {
                    var callback = callbackCreator(i);
                    userList.getUser($scope.posts[i].original_creator).then(callback);
                }

            }, function(reason) {
                notify.error(gettext('Could not load posts... please try again later'));
            });
        };
        //remove the item from the list as a stopgap until update works
        $scope.removeFromPosts = function(post) {
            $scope.posts.splice($scope.posts.indexOf(post), 1);
        };
        $scope.$watch('isTimeline', function() {
            $scope.getPosts();
        });
        $scope.$watch(function() { return publishCounter.getNewPosts(); }, function(newVal, oldVal) {
            if (newVal !== 0) {
                // FIXME: Use a timeout here, because sometimes, the API crash if it happens
                // just after the previous POST request
                $timeout($scope.getPosts, 1000);
            }
        });
        $scope.$watch('posts', function() {
            if ($scope.posts.length === 0) {
                $scope.noPosts = true;
            } else {
                $scope.noPosts = false;
            }
        });
    }

    var app = angular.module('liveblog.timeline', ['superdesk.users', 'liveblog.edit'])
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
        service.removeItem = function(id) {
            var deferred = $q.defer();
            api.items.remove(id).then(function() {
                deferred.resolve('removing done');
            }, function() {
                deferred.reject('something went wrong');
            });
            return deferred.promise;
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
                scope.removeItem = function(id) {
                    if (window.confirm(gettext('Are you sure you want to remove the post?'))) {
                        notify.info(gettext('Removing'));
                        itemsService.removeItem(scope.post).then(function(message) {
                            notify.pop();
                            notify.info(gettext('Removing done'));
                            scope.remove({post:scope.post});
                        }, function() {
                            notify.pop();
                            notify.error(gettext('Something went wrong'));
                        });
                    }
                };
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
