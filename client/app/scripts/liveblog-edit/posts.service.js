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
        'api',
        '$q',
        'userList'
    ];
    function PostsService(api, $q, userList) {
        return {
            getPosts: function(blog, posts_criteria) {
                var posts = [];
                var defer = $q.defer();

                api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {_id: blog._id})
                    .query(posts_criteria)
                    .then(function(data) {
                        data._items.forEach(function(post) {
                            // update the post structure
                            angular.extend(post, {
                                // add a `multiple_items` field. Can be false or a positive integer.
                                multiple_items: post.groups[1].refs.length > 1 ? post.groups[1].refs.length : false,
                                // add a `mainItem` field containing the first item
                                mainItem: post.groups[1].refs[0]
                            });
                            // retrieve user information and add it to the post
                            (function(post) {
                                userList.getUser(post.original_creator).then(function(user) {
                                    post.original_creator_name = user.display_name;
                                });
                            })(post);
                            posts.push(post);
                        });
                        defer.resolve(posts);
                    });
                return defer.promise;
            }
        };
    }

    angular.module('liveblog.posts', [])
        .service('postsService', PostsService);
});

// EOF
