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
    'dragula',
    './module',
    './posts.service',
    './blog.service',
    './pages-manager.service'
], function(angular, _, dragula) {
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
                        allowQuickEdit: $scope.lbPostsAllowQuickEdit,
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
                        cancelReorder: function() {
                            vm.reorderPost = false;
                            $timeout(function() {
                                vm.keepHighlighted = false;
                            }, 2000);
                            $timeout(function() {
                                vm.hideAllPosts = false;
                            }, 600);
                        },
                        reorder: function(index, location) {
                            if (vm.allowReordering) {
                                var posts_list = $element.find('.posts');
                                var position = index;
                                var order, before, after;
                                if (position === 0) {
                                    order = angular.element(posts_list.find('li .lb-post').get(0)).scope().post.order + 1;
                                } else if (position === posts_list.find('li .lb-post').length - 1) {
                                    order = angular.element(posts_list.find('li .lb-post').get(position)).scope().post.order - 1;
                                } else {
                                    if (location === 'above') {
                                        before = angular.element(posts_list.find('li .lb-post').get(position - 1)).scope().post.order;
                                        after = angular.element(posts_list.find('li .lb-post').get(position)).scope().post.order;
                                    } else {
                                        before = angular.element(posts_list.find('li .lb-post').get(position)).scope().post.order;
                                        after = angular.element(posts_list.find('li .lb-post').get(position + 1)).scope().post.order;
                                    }
                                    order = after + (before - after) / 2;
                                }
                                vm.updatePostOrder(vm.reorderPost, order);
                                vm.hideAllPosts = true;
                                vm.keepHighlighted = order;
                                vm.cancelReorder();
                            }
                        },
                        updatePostOrder: function(post, order) {
                            postsService.savePost(post.blog, post, undefined, {order: order});
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
                        lbPostsAllowQuickEdit: '=',
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
            'notify', 'gettext', 'asset', 'postsService', 'modal',
            function(notify, gettext, asset, postsService, modal) {
                return {
                    scope: {
                        post: '=',
                        onEditClick: '=',
                        allowQuickEdit: '=',
                        reorderPost: '=',
                        keepHighlighted: '=',
                        allowUnpublish: '=',
                        startReorder: '&',
                        reorder: '&',
                        index: '='
                    },
                    replace: true,
                    restrict: 'E',
                    templateUrl: 'scripts/liveblog-edit/views/post.html',
                    link: function(scope, elem, attrs) {
                        angular.extend(scope, {
                            toggleMultipleItems: function() {
                                scope.post.show_all = !scope.post.show_all;
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
