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
        '$rootScope'
    ];
    function PostsService(api, $q, userList, $rootScope) {

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
                        // complete Post With User Information
                        userList.getUser(post.original_creator).then(function(user) {
                            post.original_creator_name = user.display_name;
                        });
                    });
                    return data;
                });
        }

        function fetchPosts(blog_id, filters, max_results, page) {
            filters       = filters     || {};
            page          = page        || 1;
            max_results   = max_results || 15;
            var posts_criteria = {
                source: {
                    query: {filtered: {filter: {and: [{not: {term: {deleted: true}}}]}}}
                },
                page: page,
                max_results: max_results
            };
            // filters.status
            if (angular.isDefined(filters.status)) {
                posts_criteria.source.query.filtered.filter.and.push({term: {post_status: filters.status}});
            }
            // filters.updatedAfter
            if (angular.isDefined(filters.updatedAfter)) {
                posts_criteria.source.query.filtered.filter.and.push({
                    range: {
                        _updated: {
                            gt: filters.updatedAfter
                        }
                    }
                });
            }
            return retrievePosts(blog_id, posts_criteria);
        }

        function getLatestUpdateDate(posts) {
            if (!angular.isDefined(posts) || posts.length < 1) {
                return;
            }
            var latest_date, date;
            posts.forEach(function (post) {
                date = moment(post._updated);
                if (angular.isDefined(latest_date)) {
                    if (latest_date.diff(date) < 0) {
                        latest_date = date;
                    }
                } else {
                    latest_date = date;
                }
            });
            return latest_date.utc().format();
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
                            return api.posts.save(post_to_update, {deleted: true}).then(function() {
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
            var deleted = {deleted: true};
            return savePost(post.blog, post, [], deleted);
        }

        return {
            fetchPosts: fetchPosts,
            getLatestUpdateDate: getLatestUpdateDate,
            // updateItems: updateItems,
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
