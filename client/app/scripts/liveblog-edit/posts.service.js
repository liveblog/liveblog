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
    'angular'
], function(angular) {
    'use strict';

    PostsService.$inject = [
        'api'
    ];
    function PostsService(api) {
        return {
            getPostsForBlog: function(blog, posts_criteria) {
                return api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {_id: blog._id}).query(posts_criteria);
            }
        };
    }

    angular.module('liveblog.posts', [])
        .service('postsService', PostsService);
});

// EOF
