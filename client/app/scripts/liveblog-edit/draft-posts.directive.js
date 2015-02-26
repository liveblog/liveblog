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
            postsService.getPostsForBlog($scope.blog).then(function(data) {
                $scope.posts = data._items;
                // $scope.posts.forEach(function(post) {
                //     console.log(typeof(post.post_status));
                // });
            });
        }
        return {
            restrict: 'E',
            scope: { // isolated scope
                blog: '='
            },
            template: [
                '<div>',
                '    <ul>',
                '        <li ng-repeat="post in posts">',
                '            {{ post.post_status }}',
                '        </li>',
                '    <ul>',
                // '    <pre>{{ posts | json }}</pre>',
                '</div>'
            ].join(''),
            controller: DraftPostsController
        };
    }

    angular.module('liveblog.edit')
        .directive('draftPosts', DraftPostsDirective);
});

// EOF
