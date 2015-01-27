/*jshint nonew: false */
define([
    'angular'
], function(angular) {
    'use strict';
    TimelineController.$inject = ['api', '$scope', '$rootScope', 'notify', 'gettext',
                                '$route', '$q', '$cacheFactory', 'userList', 'publishCounter'];
    function TimelineController(api, $scope, $rootScope, notify, gettext,
                                 $route, $q, $cacheFactory, userList, publishCounter) {
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
        $scope.$watch(function() { return publishCounter.getNewPosts(); }, function(newVal, oldVal) {
            if (newVal !== 0) {
                $scope.getPosts();
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
    }]).controller('TimelineController', TimelineController)
    .directive('lbTimelineItem', ['api', 'notify', 'gettext', 'asset', function(api, notify, gettext, asset) {
        return {
            scope: {
                post: '='
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
                    //temp solution so quick edit items
                    var tempQE = {};
                    _.extend(tempQE, scope.seItem);
                    tempQE._links.self.href = '/posts/' + tempQE._id;
                    notify.info(gettext('Updating post'));
                    var textModif = editbl.html();
                    api.posts.save(tempQE, {text: textModif}).then(function() {
                        notify.pop();
                        notify.info(gettext('Post updated'));
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
