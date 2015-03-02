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
        'userList',
        '$rootScope'
    ];
    function PostsService(api, $q, userList, $rootScope) {
        var drafts = {};
        var posts = {};

        function getPosts(blog_id, posts_criteria) {
            // TODO: support posts_criteria in cache
            // If we've already cached it, return that one.
            // But return a promise version so it's consistent across invocations
            if (angular.isDefined(posts[blog_id])) {
                return $q.when(posts[blog_id]);
            }
            posts[blog_id] = [];
            return retrievePosts(blog_id, posts_criteria).then(function(data) {
                posts[blog_id] = data;
                return posts[blog_id];
            });
        }

        function getDraft(blog_id, posts_criteria) {
            // TODO: support posts_criteria in cache
            if (angular.isDefined(drafts[blog_id])) {
                return $q.when(drafts[blog_id]);
            }
            drafts[blog_id] = [];
            return retrievePosts(blog_id, posts_criteria).then(function(data) {
                // TODO: add the filter in the query
                drafts[blog_id] = data.filter(function(post) {
                    return post.post_status === 'draft';
                });
                return drafts[blog_id];
            });
        }

        function savePost(blog_id, post_to_update, items, post_status) {
            post_status = post_status || 'open';
            var dfds = [];
            // save every items
            _.each(items, function(item) {
                dfds.push(api.items.save(item));
            });
            return $q.all(dfds).then(function(items) {
                var post = {
                    blog: blog_id,
                    post_status: post_status,
                    groups: [
                        {
                            id: 'root',
                            refs: [{idRef: 'main'}],
                            role: 'grpRole:NEP'
                        }, {
                            id: 'main',
                            refs: [],
                            role: 'grpRole:Main'
                        }
                    ]
                };
                // update the post reference (links with items)
                _.each(items, function(item) {
                    post.groups[1].refs.push({residRef: item._id});
                });
                var operation;
                if (angular.isDefined(post_to_update)) {
                    operation = function updatePost() {
                        return api.posts.save(post_to_update, post);
                    };
                } else {
                    operation = function createPost() {
                        return api.posts.save(post);
                    };
                }
                return operation().then(function (post) {
                    // refresh local lists after it was saved
                    // if (post_status === 'draft') {
                    //     drafts[blog_id].push(post);
                    // } else {
                    //     posts[blog_id].push(post);
                    // }
                    // FIXME: `post` should contains items, then this following operation would be useless.
                    drafts = {};
                    posts = {};
                    // broadcast an event when updated
                    $q.all([getPosts(blog_id), getDraft(blog_id)]).then(function() {
                        $rootScope.$broadcast('lb.posts.updated', drafts);
                    });
                });
            });
        }

        function retrievePosts(blog_id, posts_criteria) {
            return api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {_id: blog_id})
                .query(posts_criteria)
                .then(function(data) {
                    var posts = [];
                    data._items.forEach(function(post) {
                        // update the post structure
                        angular.extend(post, {
                            // add a `multiple_items` field. Can be false or a positive integer.
                            // FIXME: left like that to support other feature, but this need to be in camelcase
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
                    return posts;
                });
        }

        return {
            drafts: drafts,
            getPosts: getPosts,
            getDrafts: getDraft,
            savePost: savePost,
            saveDraft: function(blog_id, post, items, post_status) {
                return savePost(blog_id, post, items, 'draft');
            }
        };
    }

    angular.module('liveblog.posts', [])
        .service('postsService', PostsService);
});

// EOF
