/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

define([
    'angular',
    'lodash',
    './module',
    './posts.service',
    './blog.service',
    './pages-manager.service'
], function(angular, _) {
    'use strict';

    angular.module('liveblog.edit')
        // * SLIDEABLE
        // *  used for left side bar
        // *   - slideable: take a boolean, true to be opened
        // *   - slideableMove: take the other element to be right-moved
        .directive('slideable', function() {
            return {
                restrict: 'A',
                scope: {
                    'slideableMove': '@',
                    'slideable': '='
                },
                link: function(scope, element, attrs) {
                    var old_left = parseInt(element.css('left'), 10);
                    var to_be_moved = angular.element(document.querySelectorAll(scope.slideableMove));
                    var panel_width = element.width();
                    function toggleSlide() {
                        if (scope.slideable) {
                            element.show();
                            to_be_moved.css({
                                left: panel_width + old_left
                            });
                        } else {
                            element.hide();
                            to_be_moved.css({
                                left: old_left
                            });
                        }
                    }
                    scope.$watch('slideable', toggleSlide);
                }
            };
        })
        .directive('lbPostsList', [
            'postsService', 'notify', '$q', '$timeout', 'session', 'PagesManager',
            function(postsService, notify, $q, $timeout, session, PagesManager) {

                LbPostsListCtrl.$inject = ['$scope', '$element'];
                function LbPostsListCtrl($scope, $element) {
                    var vm = this;
                    angular.extend(vm, {
                        isLoading: true,
                        blogId: $scope.lbPostsBlogId,
                        emptyMessage: $scope.lbPostsEmptyMessage,
                        allowUnpublish: $scope.lbPostsAllowUnpublish,
                        allowReordering: $scope.lbPostsAllowReordering,
                        onPostSelected: $scope.lbPostsOnPostSelected,
                        showReorder: false,
                        hideAllPosts: false,
                        originalOrder: 0,
                        pagesManager: new PagesManager($scope.lbPostsBlogId,
                                                       $scope.lbPostsStatus,
                                                       10,
                                                       $scope.lbPostsOrderBy || 'editorial'),
                        fetchNewPage: function() {
                            vm.isLoading = true;
                            return vm.pagesManager.fetchNewPage().then(function() {
                                vm.isLoading = false;
                            });
                        },
                        startReorder: function(post) {
                            vm.reorderPost = post;
                        },
                        clearReorder: function() {
                            vm.reorderPost = false;
                            $timeout(function() {
                                vm.keepHighlighted = false;
                            }, 2000);
                            $timeout(function() {
                                vm.hideAllPosts = false;
                            }, 200);
                        },
                        getOrder: function(position) {
                            return angular.element($element.find('.posts').find('li .lb-post').get(position)).scope().post.order;
                        },
                        reorder: function(index, location) {
                            if (vm.allowReordering) {
                                var position = index;
                                var order, before, after;
                                if (position === 0) {
                                    order = vm.getOrder(0) + 1;
                                } else if (position === $element.find('.posts').find('li .lb-post').length - 1) {
                                    order = vm.getOrder(position) - 1;
                                } else {
                                    if (location === 'above') {
                                        before = vm.getOrder(position - 1);
                                        after = vm.getOrder(position);
                                    } else {
                                        before = vm.getOrder(position);
                                        after = vm.getOrder(position + 1);
                                    }
                                    order = after + (before - after) / 2;
                                }
                                vm.updatePostOrder(vm.reorderPost, order);
                            }
                        },
                        updatePostOrder: function(post, order) {
                            vm.hideAllPosts = true;
                            postsService.savePost(post.blog, post, undefined, {order: order}).then(function() {
                                vm.keepHighlighted = order;
                                vm.clearReorder();
                            }, function() {
                                vm.hideAllPosts = false;
                                notify.pop();
                                notify.error(gettext('Something went wrong. Please reload and try again later'));
                            });
                        },
                        isPostsEmpty: function() {
                            return vm.pagesManager.count() < 1 && !vm.isLoading;
                        }
                    });
                    $scope.lbPostsInstance = vm;
                    // retrieve first page
                    vm.fetchNewPage()
                    // retrieve updates when event is recieved
                    .then(function() {
                        $scope.$on('posts', function(e, event_params) {
                            vm.isLoading = true;
                            vm.pagesManager.retrieveUpdate(true).then(function() {
                                if (event_params.deleted === true) {
                                    notify.pop();
                                    notify.info(gettext('Removing the post...'));
                                }
                                vm.isLoading = false;
                            });
                        });
                    });
                }
                return {
                    scope: {
                        lbPostsBlogId: '=',
                        lbPostsStatus: '@',
                        lbPostsOrderBy: '@',
                        lbPostsEmptyMessage: '@',
                        lbPostsAllowUnpublish: '=',
                        lbPostsAllowReordering: '=',
                        lbPostsOnPostSelected: '=',
                        lbPostsInstance: '='
                    },
                    restrict: 'EA',
                    templateUrl: 'scripts/liveblog-edit/views/posts.html',
                    controllerAs: 'postsList',
                    controller: LbPostsListCtrl
                };
            }
        ])
        .directive('lbPost', [
            'notify', 'gettext', 'asset', 'postsService', 'modal', 'blogSecurityService',
            function(notify, gettext, asset, postsService, modal, blogSecurityService) {
                return {
                    scope: {
                        post: '=',
                        onEditClick: '=',
                        //the post that is in the process of being reordered
                        reorderPost: '=',
                        //the order property of the post that was reordered and should stay highlighted a bit more
                        keepHighlighted: '=',
                        allowUnpublish: '=',
                        allowReordering: '=',
                        //call when the user clicks on the reorder icon
                        startReorder: '&',
                        //call when the user has chosen a new place for the post
                        reorder: '&',
                        //the index of the post in the list
                        index: '='
                    },
                    restrict: 'E',
                    templateUrl: 'scripts/liveblog-edit/views/post.html',
                    link: function(scope, elem, attrs) {
                        angular.extend(scope, {
                            isAbleToEditContribution: function(post) {
                                return blogSecurityService.canPublishAPost() || blogSecurityService.isUserOwner(post);
                            },
                            toggleMultipleItems: function() {
                                scope.show_all = !scope.show_all;
                            },
                            removePost: function(post) {
                                postsService.remove(angular.copy(post)).then(function(message) {
                                    notify.pop();
                                    notify.info(gettext('Post removed'));
                                }, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong'));
                                });
                            },
                            preMovePost: function(post) {
                                scope.startReorder({post: post});
                            },
                            movePost: function(index, location) {
                                scope.reorder({index: index, location: location});
                            },
                            askRemovePost: function(post) {
                                modal.confirm(gettext('Are you sure you want to delete the post?'))
                                    .then(function() {
                                        scope.removePost(post);
                                    });
                            },
                            unpublishPost: function(post) {
                                // don't save the original post coming for the posts list, because it needs
                                // to conserve its original update date in the posts list directive
                                // in order to retrieve updates from this date (if latest)
                                post = angular.copy(post);
                                // save the post as draft
                                postsService.saveDraft(post.blog, post).then(function(post) {
                                    notify.pop();
                                    notify.info(gettext('Post saved as draft'));
                                }, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong. Please try again later'));
                                });
                            }
                        });
                    }
                };
            }
        ])
        .directive('stopEvent', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    element.bind(attr.stopEvent, function (e) {
                        e.stopPropagation();
                    });
                }
            };
        })
        .directive('selectTextOnClick', [function() {
            return {
                link: function(scope, elem, attrs) {
                    elem.bind('click', function() {
                        elem.focus();
                        elem.select();
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
        }]);
});

// EOF
