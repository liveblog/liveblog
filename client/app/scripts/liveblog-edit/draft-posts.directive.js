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
            postsService.getPosts($scope.blog).then(function (data) {
                $scope.posts = data;
            });
            angular.extend($scope, {
                openDraftInEditor: function(draft) {
                    // TODO
                }
            });
        }
        return {
            restrict: 'E',
            scope: { // isolated scope
                blog: '='
            },
            templateUrl: 'scripts/liveblog-edit/views/draft-posts-list.html',
            controller: DraftPostsController
        };
    }

    angular.module('liveblog.edit')
        .directive('draftPosts', DraftPostsDirective);
});

// EOF
