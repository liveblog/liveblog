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
    './module'
], function(angular, _) {
    'use strict';

    DraftPostsController.$inject = [
        '$scope',
        'api'
    ];
    function DraftPostsController($scope, api) {
        // api.posts.query().then(function(data) {
        //     console.log(data);
        // });
        angular.extend($scope, {
            // TODO Give a blog id
            posts: api.posts.query()
        });
    }

    function DraftPostsDirective() {
        return {
            restrict: 'E',
            template: [
                '<div>',
                '    <ul>',
                '        <pre>{{ posts | json }}</pre>',
                '        <pre>{{ posts._items | json }}</pre>',
                '        <li ng-repeat="post in posts._items">',
                '            {{ post.post_id }}',
                '        </li>',
                '    <ul>',
                '</div>'
            ].join(''),
            controller: DraftPostsController
        };
    }

    angular.module('liveblog.edit')
        .directive('draftPosts', DraftPostsDirective);
});

// EOF
