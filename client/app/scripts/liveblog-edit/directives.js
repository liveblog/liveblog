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
    './blog.service'
], function(angular, _) {
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
        .directive('draftPosts', ['api', 'postsService',
            function DraftPostsDirective(api, postsService) {
                DraftPostsController.$inject = ['$scope'];
                function DraftPostsController($scope) {
                    var mv = this;
                    mv.posts = [];
                    mv.postsInfo = {};
                    mv.selectDraftPost = $scope.onDraftPostSeleted;
                    function updateList() {
                        postsService.fetchDrafts(
                            $scope.blog._id,
                            mv.posts,
                            mv.postsInfo
                        );
                    }
                    $scope.$on('posts', function() {
                        postsService.updatePosts($scope.blog._id, 'draft', mv.posts, mv.postsInfo);
                    });
                    $scope.$on('items', function() {
                        postsService.updateItems($scope.blog._id, mv.posts, mv.postsInfo);
                    });
                    // initialize list
                    updateList();
                }
                return {
                    restrict: 'E',
                    replace: true,
                    scope: { // isolated scope
                        blog: '=',
                        onDraftPostSeleted: '='
                    },
                    templateUrl: 'scripts/liveblog-edit/views/draft-posts-list.html',
                    controller: DraftPostsController,
                    controllerAs: 'draftPosts'
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
                        allowQuickEdit: '='
                    },
                    replace: true,
                    restrict: 'E',
                    templateUrl: 'scripts/liveblog-edit/views/post.html',
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
