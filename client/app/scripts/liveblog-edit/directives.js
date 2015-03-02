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
    './posts.service'
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
                function DraftPostsController($scope, $element) {
                    var mv = this;
                    mv.selectDraftPost = $scope.onDraftPostSeleted;
                    mv.removeDraftPost = postsService.remove;
                    // initialize list
                    postsService.getDrafts($scope.blog._id).then(function (posts) {
                        mv.posts = posts;
                    });
                    // update list when needed
                    $scope.$on('lb.posts.updated', function(e, data) {
                        var posts = _.values(data)[0];
                        mv.posts = posts;
                    });
                }
                return {
                    restrict: 'E',
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
        .directive('stopEvent', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    element.bind(attr.stopEvent, function (e) {
                        e.stopPropagation();
                    });
                }
            };
        });
});

// EOF
