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
        'userList'
    ];
    function PostsService(api, $q, userList) {
        /**
         * Fetch a page of posts
         * @param {string} blog_id - The id of the blog
         * @param {object} filters - (available: {boolean} 'status', {string} 'updatedAfter')
         * @param {integer} max_results - maximum number of results per page
         * @param {integer} page - page index
         */
        function getPosts(blog_id, filters, max_results, page) {
            filters     = filters     || {};
            page        = page        || 1;
            max_results = max_results || 15;
            // excludeDeleted: default set to true
            filters.excludeDeleted = angular.isDefined(filters.excludeDeleted) ? filters.excludeDeleted : true;
            var posts_criteria = {
                source: {
                    query: {filtered: {filter: {
                        and: []
                    }}}
                },
                page: page,
                max_results: max_results
            };
            // filters.excludeDeleted
            if (filters.excludeDeleted) {
                posts_criteria.source.query.filtered.filter.and.push({not: {term: {deleted: true}}});
            }
            // filters.sort
            if (angular.isDefined(filters.sort)) {
                // this converts the format '-_created' to the elasticsearch one
                var order = 'asc';
                if (filters.sort.charAt(0) === '-') {
                    filters.sort = filters.sort.slice(1);
                    order = 'desc';
                }
                var sort = {};
                sort[filters.sort] = {order: order, missing: '_last', unmapped_type: 'long'};
                posts_criteria.source.sort = [sort];
            }
            // filters.status
            if (angular.isDefined(filters.status)) {
                posts_criteria.source.query.filtered.filter.and.push({term: {post_status: filters.status}});
            }
            // filters.sticky
            if (angular.isDefined(filters.sticky)) {
                posts_criteria.source.query.filtered.filter.and.push({term: {sticky: filters.sticky}});
            }
            // filters.authors
            if (angular.isDefined(filters.authors) && filters.authors.length > 0) {
                posts_criteria.source.query.filtered.filter.and.push({
                    or: {
                        filters: filters.authors.map(function(author) {
                            return {term: {original_creator: author}};
                        })
                    }
                });
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
            // filters.highlight
            if (angular.isDefined(filters.highlight)) {
                posts_criteria.source.query.filtered.filter.and.push({term: {highlight: filters.highlight}});
            }
            // filters.sticky
            if (angular.isDefined(filters.sticky)) {
                posts_criteria.source.query.filtered.filter.and.push({term: {sticky: filters.sticky}});
            }

            // filters.status
            if (angular.isDefined(filters.syndicationIn)) {
                posts_criteria.source.query.filtered.filter.and.push({
                    term: {syndication_in: filters.syndicationIn}
                });
            }

            if (angular.isDefined(filters.noSyndication)) {
                posts_criteria.source.query.filtered.filter.and.push({
                    missing: { field: 'syndication_in' }
                });
            }

            return retrievePosts(blog_id, posts_criteria);
        }

        function _completeUser(obj) {
            if (obj.commenter) {
                obj.user = {display_name: obj.commenter};
            } else {
                userList.getUser(obj.original_creator).then(function(user) {
                    obj.user = user;
                });
            }
            return obj;
        }
        function _completePost(post) {
            return $q(function(resolve, reject) {
                angular.extend(post, {
                    // add a `multiple_items` field. Can be false or a positive integer.
                    // FIXME: left like that to support other feature, but this need to be in camelcase
                    multiple_items: post.groups[1].refs.length > 1 ? post.groups[1].refs.length : false,
                    // add a `mainItem` field containing the first item
                    mainItem: post.groups[1].refs[0],
                    items: post.groups[1].refs
                });

                // if an item has a commenter then that post hasComments.
                post.hasComments = _.reduce(post.groups[1].refs, function(is, val) {
                    return is || !_.isUndefined(val.item.commenter);
                }, false);
                // `fullDetails` is a business logic that can be compiled from other objects.
                post.fullDetails = post.hasComments;
                // special cases for comments.
                post.showUpdate = (post.content_updated_date !== post.published_date) &&
                                   (!post.hasComments) && (post.mainItem.item.item_type !== 'comment');
                angular.forEach(post.items, function(val) {
                    if (post.fullDetails) {
                        _completeUser(val.item);
                    }
                });
                _completeUser(post.mainItem.item);

                if (post.syndication_in && api.hasOwnProperty('syndicationIn')) {
                    api.syndicationIn.getById(post.syndication_in).then(function(synd) {
                        post.producer_blog_title = synd.producer_blog_title;
                        resolve(post);
                    }, function() {
                        resolve(post);
                    });
                } else {
                    resolve(post)
                }
            });
        }

        function retrievePost(post_id) {
            return api.posts.getById(post_id)
                .then(_completePost)
                .then(function(post) {
                    return post;
                });
        }

        function retrievePosts(blog_id, posts_criteria) {
            return api('blogs/<regex(\"[a-f0-9]{24}\"):blog_id>/posts', {_id: blog_id})
                .query(posts_criteria)
                .then(function(data) {
                    return $q.all(data._items.map(_completePost))
                        .then(function(result) {
                            return angular.extend(data, { _items: result });
                        });
                });
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
                            group_type: item.group_type,
                            item_type: item.item_type,
                            commenter: item.meta && item.meta.commenter
                        };
                    }
                    dfds.push(api.items.save(item));
                });
            }
            // save the post
            return $q.all(dfds).then(function(items) {
                if (dfds.length > 0) {
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
                }
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
            var deleted = {deleted: true};
            return savePost(post.blog, post, [], deleted);
        }

        return {
            getPosts: getPosts,
            getLatestUpdateDate: getLatestUpdateDate,
            retrievePost: retrievePost,
            savePost: savePost,
            saveDraft: function(blog_id, post, items, sticky, highlight) {
                return savePost(blog_id, post, items, {post_status: 'draft', 'sticky': sticky, 'highlight': highlight});
            },
            saveContribution: function(blog_id, post, items, sticky, highlight) {
                return savePost(blog_id, post, items, {post_status: 'submitted', 'sticky': sticky, 'highlight': highlight});
            },
            remove: removePost
        };
    }

    angular.module('liveblog.posts', [])
        .service('postsService', PostsService);
});

// EOF
