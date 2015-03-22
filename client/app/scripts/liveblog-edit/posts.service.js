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
    'moment',
    'lodash'
], function(angular, moment, _) {
    'use strict';

    PostsService.$inject = [
        'api',
        '$q',
        'userList',
        '$rootScope',
        '$cacheFactory'
    ];
    function PostsService(api, $q, userList, $rootScope, $cacheFactory) {

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

        // get the last updated time from a list based on the format function.
        function lastUpdated(items, format) {
            switch (items.length) {
                case 0:
                    // when we start we don't have any items,
                    // so starting point is now less 5 minutes.
                    return moment().subtract(5, 'minutes');
                case 1:
                    return format(items[0]);
                default:
                    return _.reduce(items, function(memo, item) {
                            memo = format(memo);
                            item = format(item);
                            return (item.diff(memo) > 0) ? item: memo;
                        });

            }
        }

        // generate a criteria for updateing items.
        function updateItemsCriteria(blog_id, posts) {
            var momentLast = lastUpdated(posts, function(post) {
                    return (post.items)?
                        (lastUpdated(post.items, function(item) {
                            return (item.item._updated)? moment(item.item._updated) : item;
                        })) : post;
                }),
                filter = [
                {range: {
                    _updated: {
                            gt: momentLast.utc().format()
                        }
                    }
                }], criteria = {
                    source: {
                        query: {filtered: {filter: {
                            and: filter
                        }}}
                    }
            };
            return criteria;
        }

        // generate a criteria for updateing posts.
        function updatePostCriteria(blog_id, posts, type) {
            var momentLast = lastUpdated(posts, function(post) {
                return (post._updated)? moment(post._updated) : post;
            }), filter = [
                {range: {
                    _updated: {
                            gt: momentLast.utc().format()
                        }
                    }
                }, {term: {
                        post_status: type
                        }
                    }
            ], criteria = {
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
            retrieveItems(blog_id, updateItemsCriteria(blog_id, posts)).then(function(data) {
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
            });
        }

        // update changes in posts
        // it will add/remove new items in post.
        function updatePosts(blog_id, type, posts, postsInfo) {
            var indexNewPost, currentPost, indexOldItem;
            retrievePosts(blog_id, updatePostCriteria(blog_id, posts, type)).then(function(data) {
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
                        if (!post.deleted) {
                            postsInfo.total++;
                            posts.push(post);
                        }
                    }
                });
            });
        }

        function fetchPosts(blog_id, status, posts_criteria, posts, postsInfo) {
            posts_criteria.source = {
                query: {filtered: {filter: {and: [{term: {post_status: status}}, {not: {term: {deleted: 'on'}}}]}}}
            };
            return retrievePosts(blog_id, posts_criteria).then(function(data) {
                posts.push.apply(posts, data._items);
                postsInfo.total = data._meta.total;
            });
        }

        function savePost(blog_id, post_to_update, items, post) {
            post = post || {};
            post.post_status = post.post_status || _.result(post_to_update, 'post_status') || 'open';
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
                angular.extend(post, {
                    blog: blog_id,
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
                });
                // update the post reference (links with items)
                _.each(items, function(item) {
                    post.groups[1].refs.push({residRef: item._id});
                });
                var operation;
                if (angular.isDefined(post_to_update)) {
                    operation = function updatePost() {
                        if ((post_to_update.post_status === 'draft') && (post.post_status === 'open')) {
                            return api.posts.save(post_to_update, {deleted: 'on'}).then(function() {
                                api.posts.save(post);
                            });
                        } else {
                            return api.posts.save(post_to_update, post);
                        }
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
            //var deleted =  {_deleted: moment().utc().format()};
            var deleted = {deleted: 'on'};
            return savePost(post.blog, post, [], deleted);
        }

        return {
            fetchPosts: fetchPosts,
            fetchDrafts: function(blog_id, posts, postsInfo) {
                return fetchPosts(blog_id, 'draft', {} , posts, postsInfo);
            },
            updatePosts: updatePosts,
            updateItems: updateItems,
            savePost: savePost,
            saveDraft: function(blog_id, post, items) {
                return savePost(blog_id, post, items, {post_status: 'draft'});
            },
            remove: removePost
        };
    }

    angular.module('liveblog.posts', [])
        .service('postsService', PostsService);
});

// EOF
