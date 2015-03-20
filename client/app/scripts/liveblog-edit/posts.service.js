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
    'lodash'
], function(angular, _) {
    'use strict';

    PostsService.$inject = [
        'api',
        '$q',
        'userList',
        '$rootScope',
        '$cacheFactory'
    ];
    function PostsService(api, $q, userList, $rootScope, $cacheFactory) {
        var lastIndex = [];

        function retrievePosts(blog_id, posts_criteria) {
            return api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {_id: blog_id})
                .query(posts_criteria)
                .then(function(data) {
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
                        userList.getUser(post.original_creator).then(function(user) {
                            post.original_creator_name = user.display_name;
                        });
                    });
                    return data;
                });
        }

        // get the items based on the blog and criteria ro retrieve them.
        function retrieveItems(blog_id, items_criteria) {
            return api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/items', {_id: blog_id})
                .query(items_criteria);
        }

        // update the last index with the new one from the blog.
        // keeps track of where the latest changes in items and posts,
        // this is reflected into the blog on the `_updated` field.
        function updateLastIndex(blog) {
            if (lastIndex[0] !== blog._updated) {
                lastIndex.unshift(blog._updated);
            }
        }

        function removeLastIndex() {
            _.debounce(function() {
                lastIndex.pop();
            }, 500);
        }

        // generate a criteria for updateing posts and items.
        function updateCriteria(blog_id, type) {
            var filter = [], criteria;
            filter.push({range: {
                    _updated: {
                            gt: lastIndex[lastIndex.length - 1]
                        }
                    }
                });
            if (type) {
                filter.push({term: {
                        post_status: type
                        }
                    });
            };
            criteria = {
                    source: {
                        query: {filtered: {filter: {
                            and: filter
                        }}}
                    }
            };
            return criteria;
        }

        // update the latest changes in items
        // it will not detect newly added items in post.
        function updateItems(blog_id, posts, postsInfo) {
            var indexItem;
            retrieveItems(blog_id, updateCriteria(blog_id)).then(function(data) {
                angular.forEach(data._items, function(item) {
                    angular.forEach(posts, function(post, indexPost) {
                        indexItem = _.findIndex(post.items, {residRef: item._id});
                        if (indexItem !== -1) {
                            if (item.deleted) {
                                post.items.splice(indexItem, 1);
                                if (post.items.length === 0) {
                                    posts.splice(indexPost, 1);
                                    postsInfo.total--;
                                }
                            } else {
                                angular.extend(post.items[indexItem].item, item);
                            }
                        }
                    });
                });
                removeLastIndex();
            });
        }

        // update changes in posts
        // it will add/remove new items in post.
        function updatePosts(blog_id, type, posts, postsInfo) {
            var indexNewPost, currentPost, indexOldItem;
            retrievePosts(blog_id, updateCriteria(blog_id, type)).then(function(data) {
                angular.forEach(data._items, function(post) {
                    indexNewPost = _.findIndex(posts, {_id: post._id});
                    if (indexNewPost !== -1) {
                        if (post.deleted) {
                            // remove the post from posts
                            posts.splice(indexNewPost, 1);
                            postsInfo.total--;
                        } else {
                            currentPost = posts[indexNewPost];
                            angular.forEach(post.items, function(item, indexNewItem) {
                                indexOldItem = _.findIndex(currentPost.items, {residRef: item.item._id});
                                if (indexOldItem !== -1) {
                                    // delete item if property deleted is on.
                                    if (item.item.deleted) {
                                        // remove post if the deleted item is single.
                                        if (currentPost.items.length === 1) {
                                            posts.splice(indexNewPost, 1);
                                        } else {
                                            currentPost.items.splice(indexOldItem, 1);
                                        }
                                    } else {
                                        // update the item now.
                                        angular.extend(currentPost.items[indexOldItem].item, item);
                                    }
                                } else {
                                    // add new item in the proper position.
                                    currentPost.items.splice(indexNewItem, 0, item);
                                }
                            });
                        }
                    } else {
                        postsInfo.total++;
                        posts.push(post);
                    }
                });
                removeLastIndex();
            });
        }

        function fetchPosts(blog_id, status, posts_criteria, posts, postsInfo) {
            posts_criteria.source = {
                query: {filtered: {filter: {and: [{term: {post_status: status}}]}}}
            };
            return retrievePosts(blog_id, posts_criteria).then(function(data) {
                posts.push.apply(posts, data._items);
                postsInfo.total = data._meta.total;
            });
        }

        function savePost(blog_id, post_to_update, items, post_status) {
            post_status = post_status || _.result(post_to_update, 'post_status') || 'open';
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
                            blog: blog_id,
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
                return operation();
            });
        }

        function removePost(post) {
            return savePost(post.blog, post, []).then(function() {
                api.posts.remove(post);
            });
        }

        return {
            fetchPosts: fetchPosts,
            fetchDrafts: function(blog_id, posts, postsInfo) {
                return fetchPosts(blog_id, 'draft', {} , posts, postsInfo);
            },
            updateLastIndex: updateLastIndex,
            updatePosts: updatePosts,
            updateItems: updateItems,
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
