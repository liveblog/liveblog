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
    './pages-manager.service',
    './freetype.service'
], function(angular, _) {
    'use strict';

    angular.module('liveblog.edit')
        .directive('lbPostsList', [
            'postsService', 'notify', '$q', '$timeout', 'session', 'PagesManager',
            function(postsService, notify, $q, $timeout, session, PagesManager) {

                LbPostsListCtrl.$inject = ['$scope', '$element'];
                function LbPostsListCtrl($scope, $element) {
                   
                    $scope.lbSticky = $scope.lbSticky === 'true';
                    var vm = this;
                    angular.extend(vm, {
                        isLoading: true,
                        blogId: $scope.lbPostsBlogId,
                        status: $scope.lbPostsStatus,
                        sticky: $scope.lbSticky,
                        allowUnpublishing: $scope.lbPostsAllowUnpublishing,
                        allowReordering: $scope.lbPostsAllowReordering,
                        allowEditing: $scope.lbPostsAllowEditing,
                        allowDeleting: $scope.lbPostsAllowDeleting,
                        allowPublishing: $scope.lbPostsAllowPublishing,
                        isUnreadPost: $scope.lbPostsIsUnreadPost,
                        onPostSelected: $scope.lbPostsOnPostSelected,
                        showReorder: false,
                        hideAllPosts: false,
                        originalOrder: 0,
                        pagesManager: new PagesManager(
                            $scope.lbPostsBlogId,
                            $scope.lbPostsStatus,
                            //if the list is a list with sticky posts, show them all in the 1st pages
                            $scope.lbSticky === true? 100: 10,
                            $scope.lbPostsOrderBy || 'editorial',
                            $scope.lbSticky,
                            null,
                            $scope.lbPostsNoSyndication === true ? true : false
                        ),
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
                        removePostFromList: function(post) {
                            vm.pagesManager.removePost(post);
                        },
                        isPostsEmpty: function() {
                            return vm.pagesManager.count() < 1 && !vm.isLoading && vm.isStickyPostsEmpty();
                        },
                        numberOfPosts: function() {
                            return vm.pagesManager.count();
                        },
                        isStickyPostsEmpty: function() {
                            if ($scope.lbStickyInstance) {
                                return $scope.lbStickyInstance.isPostsEmpty();
                            } else {
                                return true;
                            }
                        },
                        isSinglePost: function() {
                            return vm.pagesManager.count() === 1;
                        },
                        isFilterEnable: function() {
                            return vm.pagesManager.authors.length > 0;
                        },
                        setAuthorFilter: function(users) {
                            vm.authorFilters = users;
                            vm.isLoading = true;
                            return vm.pagesManager.setAuthors(users.map(function(user) {return user._id;})).then(function() {
                                vm.isLoading = false;
                            });
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
                                    notify.info(gettext('Post removed'));
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
                        lbSticky: '@',
                        lbStickyInstance: '=',
                        lbPostsNoSyndication: '=',
                        lbPostsOrderBy: '@',
                        lbPostsAllowUnpublishing: '=',
                        lbPostsAllowReordering: '=',
                        lbPostsAllowEditing: '=',
                        lbPostsAllowDeleting: '=',
                        lbPostsAllowPublishing: '=',
                        lbPostsOnPostSelected: '=',
                        lbPostsIsUnreadPost: '=',
                        lbPostsInstance: '='
                    },
                    restrict: 'EA',
                    transclude: true,
                    templateUrl: 'scripts/liveblog-edit/views/posts.html',
                    controllerAs: 'postsList',
                    controller: LbPostsListCtrl
                };
            }
        ])
        .directive('lbItem', [function() {
            return {
                scope: {
                    item: '='
                },
                templateUrl: 'scripts/liveblog-edit/views/item.html',
            }
        }])
        .directive('lbPost', [
            'notify', 'gettext', 'asset', 'postsService', 'modal', 'blogSecurityService', '$document', 'instagramService',
            function(notify, gettext, asset, postsService, modal, blogSecurityService, $document, instagramService) {
                return {
                    scope: {
                        post: '=',
                        onEditAction: '=',
                        //the post that is in the process of being reordered
                        reorderPost: '=',
                        //the order property of the post that was reordered and should stay highlighted a bit more
                        keepHighlighted: '=',
                        //call when the user clicks on the reorder icon
                        startReorder: '&',
                        //call when the user escaped the reorder action
                        clearReorderAction: '=',
                        //call when the user has chosen a new place for the post
                        reorder: '&',
                        //the index of the post in the list
                        index: '=',
                        // the controller of parent posts list directive
                        postsListCtrl: '='
                    },
                    restrict: 'E',
                    templateUrl: 'scripts/liveblog-edit/views/post.html',
                    link: function(scope, elem, attrs) {
                        // if the escape key is press then clear the reorder action.
                        function escClearReorder(e) {
                            if (e.keyCode === 27) {
                                scope.clearReorder();
                            }
                        }
                        function changePostStatus(post, status) {
                            // don't save the original post coming for the posts list, because it needs
                            // to conserve its original update date in the posts list directive
                            // in order to retrieve updates from this date (if latest)
                            post = angular.copy(post);
                            // save the post with the new status
                            return postsService.savePost(post.blog, post, undefined, {post_status: status});
                        }
                        function changeHighlightStatus(post, status) {
                            return postsService.savePost(post.blog, post, undefined, {highlight: status});
                        }

                        angular.extend(scope, {
                            functionize: function (obj) {
                                if (typeof(obj) !== 'function') {
                                    return function() {
                                        return obj;
                                    };
                                }
                                return obj;
                            },
                            toggleMultipleItems: function() {
                                scope.show_all = !scope.show_all;

                                // check if the items toggled are instagram embeds
                                if (instagramService.postHasEmbed(scope.post.groups[1].refs)) {
                                    instagramService.processEmbeds();
                                }
                            },
                            removePost: function(post) {
                                postsService.remove(angular.copy(post)).then(function(message) {
                                    notify.pop();
                                    notify.info(gettext('Removing post...'));
                                }, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong'));
                                });
                            },
                            preMovePost: function(post) {
                                $document.bind('keypress', escClearReorder);
                                scope.startReorder({post: post});
                            },
                            movePost: function(index, location) {
                                scope.reorder({index: index, location: location});
                            },
                            clearReorder: function() {
                                $document.unbind('keypress', escClearReorder);
                                scope.clearReorderAction();
                            },
                            changePinStatus: function (post, status) {
                                return postsService.savePost(post.blog, post, undefined, {sticky: status});
                            },
                            togglePinStatus: function(post) {
                                scope.changePinStatus(post, !post.sticky).then(function(post) {
                                    notify.pop();
                                    notify.info(post.sticky ? gettext('Post was pinned') : gettext('Post was unpinned'));
                                }, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong. Please try again later'));
                                });
                            },
                            onEditClick: function(post) {
                                scope.clearReorder();
                                scope.onEditAction(post);
                            },
                            askRemovePost: function(post) {
                                scope.clearReorder();
                                modal.confirm(gettext('Are you sure you want to delete the post?'))
                                    .then(function() {
                                        scope.removePost(post);
                                    });
                            },
                            unpublishPost: function(post) {
                                scope.clearReorder();
                                changePostStatus(post, 'submitted').then(function(post) {
                                    notify.pop();
                                    notify.info(gettext('Post saved as contribution'));
                                }, function() {
                                    notify.pop();
                                    notify.error(gettext('Something went wrong. Please try again later'));
                                });
                            },
                            highlightPost: function(post) {
                                changeHighlightStatus(post, !post.highlight).then(function(post) {
                                   notify.pop();
                                   notify.info(post.highlight ? gettext('Post was highlighted') : gettext('Post was un-highlighted'));
                                }, function() {
                                   notify.pop();
                                   notify.error(gettext('Something went wrong. Please try again later'));
                                });
                            },
                            publishPost: function(post) {
                                scope.clearReorder();
                                changePostStatus(post, 'open').then(function(post) {
                                    notify.pop();
                                    notify.info(gettext('Post published'));
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
        }])
        .directive('lbFilterByMember', ['api', function(api) {
            return {
                restrict: 'E',
                scope: {
                    blogId: '=',
                    onFilterChange: '='
                },
                templateUrl: 'scripts/liveblog-edit/views/filter-by-member.html',
                controllerAs: 'vm',
                controller: ['$scope', function($scope) {
                    var vm = this;
                    angular.extend(vm, {
                        members: [],
                        openSelector: false,
                        preselectedUsers: [],
                        selectedUsers: [],
                        findUserInPreselection: function(user_id) {
                            return _.find(vm.preselectedUsers, function(user) {
                                return user._id === user_id;
                            });
                        },
                        toggleUserInPreselection: function(user) {
                            var old_user = vm.findUserInPreselection(user._id);
                            if (old_user) {
                                vm.preselectedUsers.splice(vm.preselectedUsers.indexOf(old_user), 1);
                            } else {
                                vm.preselectedUsers.push(user);
                            }
                        },
                        isUserInPreselection: function(user) {
                            return vm.findUserInPreselection(user._id);
                        },
                        confirmPreselection: function() {
                            vm.updateFilters(angular.copy(vm.preselectedUsers));
                        },
                        updateFilters: function(fitlers) {
                            vm.selectedUsers = fitlers;
                            $scope.onFilterChange(vm.selectedUsers);
                        },
                        clearSelection: function() {
                            vm.updateFilters([]);
                        },
                        removeUserFromSelection: function(user) {
                            var filters = angular.copy(vm.selectedUsers);
                            filters.splice(vm.selectedUsers.indexOf(user), 1);
                            vm.updateFilters(filters);
                        },
                        toggleSelector: function() {
                            vm.openSelector = !vm.openSelector;
                            if (vm.openSelector) {
                                // clear the search input
                                vm.search = '';
                                // preset the preselection to the current selection
                                vm.preselectedUsers = angular.copy(vm.selectedUsers);
                                // retrieve blog information to know the owner and the members
                                api('blogs').getById($scope.blogId).then(function(blog) {
                                    // add the owner
                                    var ids = [blog.original_creator];
                                    // add the members
                                    if (blog.members) {
                                        ids.push.apply(ids, blog.members.map(function(member) {return member.user;}));
                                    }
                                    // retrieve information about these users and list them in the view
                                    api('users').query({where: {_id: {$in: ids}}}).then(function(data) {
                                        vm.members = data._items;
                                    });
                                });
                            }
                        }
                    });
                }]
            };
        }])
        .directive('autofocus', ['$timeout', function($timeout) {
            return {
                restrict: 'A',
                link: function($scope, $element) {
                    $timeout(function() {
                        $element[0].focus();
                    });
                }
            };
        }])
        .directive('fullHeight', ['$timeout', '$window', 'lodash', function($timeout, $window, _) {
            return {
                restrict: 'A',
                link: function($scope, $element, $attributes) {
                    // update the element height to the window height minus its vertical offset
                    function setHeight() {
                        $timeout(function() {
                            var height = $window.innerHeight - $element.offset().top;
                            if ($attributes.fullHeightOffsetBottom) {
                                height -= $attributes.fullHeightOffsetBottom;
                            }
                            var css_name = $attributes.fullHeightUseMaxHeight ? 'max-height' : 'height';
                            $element.css(css_name, height);
                            $element[0].focus();
                        });
                    }
                    // initialize
                    setHeight();
                    // update when the window size changes
                    angular.element($window).on('resize', _.debounce(setHeight, 500));
                    // update when offset changes
                    $scope.$watch(function() {
                        return $element.offset().top;
                    }, _.debounce(setHeight, 500));
                }
            };
        }])
        /**
        * Main directive to render the freetype editor.
        */
        .directive('freetypeRender', ['$compile', 'freetypeService', function ($compile, freetypeService) {

            return {
                restrict: 'E',
                link: function (scope, element, attrs) {
                    scope.$watch('freetype', function(freetype) {
                        element.html(freetypeService.transform(freetype.template, scope));
                        $compile(element.contents())(scope);
                        scope.initialData = angular.copy(scope.freetypeData);
                    });

                    //methods to control freetype functionality from outside the directive
                    scope.internalControl = scope.control || {};

                    //check if !dirty
                    scope.internalControl.isClean = function() {
                        return angular.equals(scope.freetypeData, scope.initialData);
                    };

                    function recursiveClean(obj) {
                        for (var key in obj) {
                            if (angular.isObject(obj[key])) {
                                //keep only the first item in the array
                                if (angular.isArray(obj[key])) {
                                    obj[key].splice(1);
                                }
                                recursiveClean(obj[key]);
                            } else {
                                if (angular.isString(obj[key])) {
                                    obj[key] = '';
                                }
                            }
                        }
                    };

                    scope.internalControl.reset = function() {
                        recursiveClean(scope.freetypeData);
                        scope.initialData = angular.copy(scope.freetypeData);  
                    };
                },
                scope: {
                    freetype: '=',
                    freetypeData: '=',
                    control: '='
                }
            };
        }])
        .directive('freetypeEmbed', ['$compile', function($compile) {

            return {
                restrict: 'E',
                template: '<textarea ng-model="embed"></textarea>',
                controller: function() {
                },
                scope: {
                    embed: '='
                }
            };
        }])
        .directive('freetypeLink', ['$compile', function($compile) {

            return {
                restrict: 'E',
                template: '<input type="url" ng-model="link"/>',
                controller: function() {
                },
                scope: {
                    link: '='
                }
            };
        }])
        .directive('freetypeCollectionAdd', ['$compile', function($compile) {
            return {
                restrict: 'E',
                template: '<button ng-click="ftca.add()" class="freetype-btn">+</button>',
                controller: ['$scope', function($scope) {
                    this.add = function() {
                        $scope.vector.push({});
                    }
                }],
                controllerAs: 'ftca',
                scope: {
                    vector: '='
                }
            };
        }])
        .directive('freetypeCollectionRemove', function() {
            return {
                restrict: 'E',
                template: '<button ng-click="ftcr.remove()" class="freetype-btn" ng-show="vector.length!==1">-</button>',
                controller: ['$scope', function($scope) {
                    this.remove = function() {
                        $scope.vector.splice($scope.index, 1);
                    }
                }],
                controllerAs: 'ftcr',
                scope: {
                    vector: '=',
                    index: '='
                }
            };
        })
        .directive('freetypeImage', ['$compile', 'modal', 'api', 'upload', '$templateCache', function($compile, modal, api, upload, $templateCache) {
            return {
                restrict: 'E',
                template: $templateCache.get('scripts/liveblog-edit/views/freetype-image.html'),
                controller: ['$scope', function($scope) {
                    var vm = this;
                    angular.extend(vm, {
                        preview: {},
                        progress: {width: 0},
                        openUploadModal: function() {
                            vm.uploadModal = true;
                        },
                        closeUploadModal: function() {
                            vm.uploadModal = false;
                            vm.preview = {};
                            vm.progress = {width: 0};
                        },
                        removeImage: function() {
                            modal.confirm(gettext('Are you sure you want to remove the blog image?')).then(function() {
                                $scope.image.picture_url = null;
                            });
                        },
                        upload: function(config) {
                            var form = {};
                            if (config.img) {
                                form.media = config.img;
                            } else if (config.url) {
                                form.URL = config.url;
                            } else {
                                return;
                            }
                            // return a promise of upload which will call the success/error callback
                            return api.archive.getUrl().then(function(url) {
                                return upload.start({
                                    method: 'POST',
                                    url: url,
                                    data: form
                                })
                                .then(function(response) {
                                    if (response.data._status === 'ERR'){
                                        return;
                                    }
                                    var picture_url = response.data.renditions.viewImage.href;
                                    $scope.image.picture_url = picture_url;
                                    $scope.image.picture = response.data._id;
                                    vm.uploadModal = false;
                                    vm.preview = {};
                                    vm.progress = {width: 0};
                                }, null, function(progress) {
                                    vm.progress.width = Math.round(progress.loaded / progress.total * 100.0);
                                });
                            });
                        }
                    });
                }],
                controllerAs: 'ft',
                scope: {
                    image: '='
                }
            };
        }]);
});

// EOF
