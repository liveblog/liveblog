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

    DraftPostsDirective.$inject = [
        'api',
        'postsService'
    ];
    function DraftPostsDirective(api, postsService) {
        function DraftPostsController($scope, $element) {
            // initialize list
            postsService.getDrafts($scope.blog._id).then(function (posts) {
                $scope.posts = posts;
            });
            // update list when needed
            $scope.$on('lb.posts.updated', function(e, data) {
                var posts = _.values(data)[0];
                $scope.posts = posts;
            });
            angular.extend($scope, {
                openDraftInEditor: function(draft) {
                    $scope.editor.reinitialize();
                    var items = draft.groups[1].refs;
                    items.forEach(function(item) {
                        item = item.item;
                        var data = _.extend({text: item.text}, item.meta);
                        $scope.editor.createBlock(item.item_type, data);
                    });
                }
            });
        }
        return {
            restrict: 'E',
            scope: { // isolated scope
                blog: '=',
                editor: '='
            },
            templateUrl: 'scripts/liveblog-edit/views/draft-posts-list.html',
            controller: DraftPostsController
        };
    }

    angular.module('liveblog.edit')
        .directive('draftPosts', DraftPostsDirective);
});

// EOF
