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
                            mainItem: post.groups[1].refs[0],
                            items: post.groups[1].refs
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

        function getPosts(blog_id, posts_criteria) {
            return retrievePosts(blog_id, posts_criteria).then(function(data) {
                // FIXME: filter in the query
                return data.filter(function(post) {
                    return typeof(post.post_status) === 'undefined' || post.post_status === 'open';
                });
            });
        }

        function getDrafts(blog_id, posts_criteria) {
            return retrievePosts(blog_id, posts_criteria).then(function(data) {
                // FIXME: filter in the query
                return data.filter(function(post) {
                    return post.post_status === 'draft';
                });
            });
        }

        function savePost(blog_id, post_to_update, items, post_status) {
            post_status = post_status || 'open';
            var dfds = [];
            if (items && items.length > 0) {
                // prepare the list of items if needed
                if (angular.isDefined(items) && items.length > 0) {
                    if (_.difference(_.keys(items[0]), ['residRef', 'item']).length === 0) {
                        items = _.map(items, function(item) {
                            return item.item;
                        });
                    }
                }
                // save every items
                _.each(items, function(item) {
                    // because it fails when item has a `_id` field without `_links`
                    if (angular.isDefined(item, '_id')) {
                        item = {
                            text: item.text,
                            meta: item.meta,
                            item_type: item.item_type
                        };
                    }
                    dfds.push(api.items.save(item));
                });
            }
            // save the post
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
                // return the post saved
                return operation().then(function (post) {
                    $rootScope.$broadcast('lb.posts.updated');
                    // post here doesn't contain the items...
                    $rootScope.$broadcast('lb.posts.saved', post);
                    return post;
                });
            });
        }

        function removePost(post) {
            return api.posts.remove(post).then(function() {
                $rootScope.$broadcast('lb.posts.updated');
                $rootScope.$broadcast('lb.posts.removed', post);
            });
        }

        return {
            getPosts: getPosts,
            getDrafts: getDrafts,
            savePost: savePost,
            saveDraft: function(blog_id, post, items, post_status) {
                return savePost(blog_id, post, items, 'draft');
            },
            remove: removePost
        };
    }

    angular.module('liveblog.posts', [])
        .service('postsService', PostsService);
});

// EOF
