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
    './blog.service'
], function(angular, _, dragula) {
    'use strict';

    // * SLIDEABLE
    // *  used for left side bar
    // *   - slideable: take a boolean, true to be opened
    // *   - slideableMove: take the other element to be right-moved
    angular.module('liveblog.edit')
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
            'postsService', 'notify', '$q', '$timeout', 'session',
            function(postsService, notify, $q, $timeout, session) {

                LbPostsListCtrl.$inject = ['$scope'];
                function LbPostsListCtrl($scope) {
                    var vm = this;

                    function fetchPage() {
                        // Find the next page containing new posts
                        var page = Math.floor(vm.posts.length / vm.pagination.limit) + 1;
                        // active loading
                        vm.isLoading = true;
                        // retrieve a page of posts
                        return postsService
                            .getPosts(vm.blogId, {status: vm.status, sort: vm.orderBy}, vm.pagination.limit, page)
                            .then(function(posts) {
                                vm.isLoading = false;
                                vm.postsMeta.total = posts._meta.total;
                                posts._items.forEach(function(post) {
                                    // add only if not already present
                                    if (getPostIndex(post._id) === -1) {
                                        vm.posts.push(post);
                                    }
                                });
                            }, function(reason) {
                                notify.error(gettext('Could not load posts... please try again later'));
                                vm.isLoading = false;
                            });
                    }

                    function getPostIndex(post_id) {
                        return _.findIndex(vm.posts, function(post) {
                            return post._id === post_id;
                        });
                    }

                    angular.extend(vm, {
                        posts: [],
                        postsMeta: {},
                        // pagination.limit is the initial amount of posts when loaded for the first time
                        pagination: {limit: 15},
                        blogId: $scope.lbPostsBlogId,
                        status: $scope.lbPostsStatus,
                        emptyMessage: $scope.lbPostsEmptyMessage,
                        orderBy: $scope.lbPostsOrderBy || '-order',
                        allowQuickEdit: $scope.lbPostsAllowQuickEdit,
                        allowUnpublish: $scope.lbPostsAllowUnpublish,
                        allowReordering: $scope.lbPostsAllowReordering,
                        onPostSelected: $scope.lbPostsOnPostSelected,
                        fetchPage: fetchPage,
                        updatePostOrder: function(post, order) {
                            postsService.savePost(post.blog, post, undefined, {order: order});
                        },
                        isPostsEmpty: function() {
                            return vm.posts.length < 1 && !vm.isLoading;
                        }
                    });
                    $scope.lbPostsInstance = vm;
                    // init posts list and metadata from database
                    $q.when(fetchPage()).then(function () {
                        // auto-update: bind events sent from backend and do the appropriated operation (a,b,c,d,e)
                        $scope.$on('posts', function(e, event_params) {
                            var post_index = getPostIndex(event_params.post_id);
                            if (event_params.deleted) {
                                if (post_index > -1) {
                                    // a) removed
                                    vm.posts.splice(post_index, 1);
                                }
                            } else if (event_params.drafted) {
                                if (vm.status === 'draft') {
                                    if (post_index < 0) {
                                        if (event_params.author_id === session.identity._id) {
                                            // b.1) new draft from the user
                                            postsService.retrievePost(event_params.post_id).then(function(data) {
                                                vm.posts.push(data);
                                            });
                                        }
                                    }
                                } else {
                                    if (post_index > -1) {
                                        // b.2) post was set as draft, we remove it
                                        vm.posts.splice(post_index, 1);
                                    }
                                }
                            } else {
                                // retrieve lastest updates from database
                                var latest_update = postsService.getLatestUpdateDate(vm.posts);
                                postsService.getPosts(vm.blogId, {
                                    updatedAfter: latest_update,
                                    sort: vm.orderBy
                                }).then(function(posts) {
                                    posts._items.forEach(function(post_updated) {
                                        if (post_updated.post_status === vm.status) {
                                            if (getPostIndex(post_updated._id) > -1) {
                                                // c) updated
                                                vm.posts[getPostIndex(post_updated._id)] = post_updated;
                                            } else {
                                                // d) added
                                                vm.posts.push(post_updated);
                                            }
                                        } else {
                                            // e) status changed, then we remove
                                            if (getPostIndex(post_updated._id) > -1) {
                                                vm.posts.splice(getPostIndex(post_updated._id), 1);
                                            }
                                        }
                                    });
                                });
                            }
                        });
                    });
                }
                function link ($scope, $element, $attrs, $ctrl) {
                    if ($ctrl.allowReordering) {
                        $timeout(function() {
                            var posts_list = $element.find('.posts');
                            dragula([posts_list.get(0)], {
                                moves: function (el, container, handle) {
                                    // disable drag and drop when the click comes from a contenteditable element
                                    return !angular.isDefined(angular.element(handle).parents().attr('contenteditable')) &&
                                    !angular.isDefined(angular.element(handle).attr('contenteditable'));
                                },
                                direction: 'vertical'
                            })
                            .on('drop', function (el) {
                                var position = posts_list.find('li.lb-post').index(el);
                                var order, before, after;
                                if (position > -1) {
                                    before = angular.element(posts_list.find('li.lb-post').get(position - 1)).scope().post.order;
                                }
                                if (position < posts_list.find('li.lb-post').length - 1) {
                                    after = angular.element(posts_list.find('li.lb-post').get(position + 1)).scope().post.order;
                                }
                                if (position === 0) {
                                    order = after + 1;
                                } else if (!angular.isDefined(after)) {
                                    order = before - 1;
                                } else {
                                    order = after + (before - after) / 2;
                                }
                                var post = angular.element(posts_list.find('li.lb-post').get(position)).scope().post;
                                $ctrl.updatePostOrder(post, order);
                            });
                        });
                    }
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
                    controller: LbPostsListCtrl,
                    link: link
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
                        allowUnpublish: '='
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
        .directive('lbSimpleEdit', ['api', 'notify', 'gettext', function(api, notify, gettext) {
            var config = {
                buttons: ['bold', 'italic', 'underline', 'quote'],
                placeholder: ''
            };
            return {
                scope: {
                    seItem: '=',
                    enabled: '=lbSimpleEdit'
                },
                priority: 0,
                templateUrl: 'scripts/liveblog-edit/views/quick-edit-buttons.html',
                link: function(scope, elem, attrs) {
                    // do nothing if the parameter `lb-simple-edit` is undefined or false
                    if (!angular.isDefined(scope.enabled) || !scope.enabled) {
                        return false;
                    }
                    scope.showButtonsSwitch = false;
                    scope.origContent = '';
                    var editbl = elem.find('[medium-editable]');
                    /*jshint nonew: false */
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
        }])
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
        }]).directive('lbBlogSettings', [function() {
            return {
                restrict: 'E',
                templateUrl: 'scripts/liveblog-edit/views/settings.html'
            };
        }]);
});

// EOF
