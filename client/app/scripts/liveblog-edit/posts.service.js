/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import angular from 'angular';
import _ from 'lodash';
import moment from 'moment';

postsService.$inject = [
    'api',
    '$q',
    'userList',
];

export default function postsService(api, $q, userList) {
    function filterPosts(filters, postsCriteria) {
        // filters.status
        if (angular.isDefined(filters.status)) {
            postsCriteria.source.query.filtered.filter.and.push({term: {post_status: filters.status}});
        }
        // filters.sticky
        if (angular.isDefined(filters.sticky)) {
            postsCriteria.source.query.filtered.filter.and.push({term: {sticky: filters.sticky}});
        }
        // filters.authors
        if (angular.isDefined(filters.authors) && filters.authors.length > 0) {
            postsCriteria.source.query.filtered.filter.and.push({
                or: {
                    filters: filters.authors.map((author) => ({term: {original_creator: author}})),
                },
            });
        }
        // filters.updatedAfter
        if (angular.isDefined(filters.updatedAfter)) {
            postsCriteria.source.query.filtered.filter.and.push({
                range: {
                    _updated: {
                        gt: filters.updatedAfter,
                    },
                },
            });
        }
        // filters.highlight
        if (angular.isDefined(filters.highlight)) {
            postsCriteria.source.query.filtered.filter.and.push({term: {lb_highlight: filters.highlight}});
        }
        // filters.sticky
        if (angular.isDefined(filters.sticky)) {
            postsCriteria.source.query.filtered.filter.and.push({term: {sticky: filters.sticky}});
        }
    }

    /**
     * Fetch a page of posts
     * @param {string} blog_id - The id of the blog
     * @param {object} filters - (available: {boolean} 'status', {string} 'updatedAfter')
     * @param {integer} max_results - maximum number of results per page
     * @param {integer} page - page index
     */
    function getPosts(blogId, filters = {}, maxResults = 15, page = 1) {
        // excludeDeleted: default set to true
        filters.excludeDeleted = angular.isDefined(filters.excludeDeleted) ? filters.excludeDeleted : true;
        const postsCriteria = {
            source: {
                query: {filtered: {filter: {
                    and: [],
                }}},
            },
            page: page,
            max_results: maxResults,
        };

        // filters.excludeDeleted
        if (filters.excludeDeleted) {
            postsCriteria.source.query.filtered.filter.and.push({not: {term: {deleted: true}}});
        }
        // filters.sort
        if (angular.isDefined(filters.sort)) {
            // this converts the format '-_created' to the elasticsearch one
            let order = 'asc';

            if (filters.sort.charAt(0) === '-') {
                filters.sort = filters.sort.slice(1);
                order = 'desc';
            }
            const sort = {};

            sort[filters.sort] = {order: order, missing: '_last', unmapped_type: 'long'};
            postsCriteria.source.sort = [sort];
        }
        filterPosts(filters, postsCriteria);
        // filters.status
        if (angular.isDefined(filters.syndicationIn)) {
            postsCriteria.source.query.filtered.filter.and.push({
                term: {syndication_in: filters.syndicationIn},
            });
        }

        if (angular.isDefined(filters.noSyndication)) {
            postsCriteria.source.query.filtered.filter.and.push({
                missing: {field: 'syndication_in'},
            });
            postsCriteria.source.query.filtered.filter.or = [{
                exists: {field: 'unpublished_date'},
            }];
        }

        return retrievePosts(blogId, postsCriteria);
    }

    /**
     * This will method will fetch the information of the creator of the post
     * or item and will attach it to the item object in order to access the user's
     * information later (profile_url, name, etc)
     *
     * @param       {Object} obj         Post or item belonging to post
     * @param       {String} postCreator (optional) - Id of user to look for
     */
    function _completeUser(obj, postCreator) {
        if (obj.commenter) {
            obj.user = {display_name: obj.commenter};
        } else if (obj.syndicated_creator) {
            obj.user = obj.syndicated_creator;
        } else {
            // TODO: way too many requests in there
            // This getUser func is returning a list of users,
            // who would have thought?
            userList.getUser(postCreator || obj.original_creator).then((user) => {
                obj.user = user;
            });
        }

        return obj;
    }
    function _completePost(post) {
        let multipleItems = false;

        if (post.groups[1].refs.length > 1) {
            multipleItems = post.groups[1].refs.length - 1;
        }

        return $q((resolve, reject) => {
            angular.extend(post, {
                multipleItems: multipleItems,
                // add a `mainItem` field containing the first item
                mainItem: post.groups[1].refs[0],
                items: post.groups[1].refs,
            });

            // if an item has a commenter then that post hasComments.
            post.hasComments = _.reduce(post.groups[1].refs,
                (is, val) => is || !_.isUndefined(val.item.commenter)
                , false);
            // `fullDetails` is a business logic that can be compiled from other objects.
            post.fullDetails = post.hasComments;
            // special cases for comments.
            post.showUpdate = post.content_updated_date !== post.published_date &&
                               !post.hasComments && post.mainItem.item.item_type !== 'comment';
            angular.forEach(post.items, (val) => {
                if (post.fullDetails) {
                    _completeUser(val.item);
                }
            });

            // let's now complete user for main post
            _completeUser(post.mainItem.item, post.original_creator);

            resolve(post);
        });
    }

    function retrievePost(postId) {
        return api.posts.getById(postId)
            .then(_completePost)
            .then((post) => post);
    }

    function retrieveSyndications(posts) {
        const syndIds = [];

        // This means the syndication module is not enabled
        if (!api.hasOwnProperty('syndicationIn')) {
            return posts;
        }

        posts._items.forEach((post) => {
            if (post.syndication_in && syndIds.indexOf(post.syndication_in) === -1) {
                syndIds.push(post.syndication_in);
            }
        });

        return $q
            .all(syndIds.map((syndId) => api.syndicationIn.getById(syndId)))
            .then((syndList) => angular.extend(posts, {
                _items: posts._items.map((post) => {
                    syndList.forEach((synd) => {
                        if (post.syndication_in === synd._id) {
                            post.producer_blog_title = synd.producer_blog_title;
                        }
                    });

                    return post;
                }),
            }));
    }

    function retrievePosts(blogId, postsCriteria) {
        return api('blogs/<regex("[a-f0-9]{24}"):blog_id>/posts', {_id: blogId})
            .query(postsCriteria)
            .then(retrieveSyndications)
            .then((data) => $q.all(data._items.map(_completePost))
                .then((result) => angular.extend(data, {_items: result})));
    }

    function getLatestUpdateDate(posts) {
        if (!angular.isDefined(posts) || posts.length < 1) {
            return;
        }
        let latestDate;
        let date;

        posts.forEach((post) => {
            date = moment(post._updated);
            if (angular.isDefined(latestDate)) {
                if (latestDate.diff(date) < 0) {
                    latestDate = date;
                }
            } else {
                latestDate = date;
            }
        });
        return latestDate.utc().format();
    }

    function savePost(blogId, postToUpdate, itemsParam, postParam = {}) {
        const post = postParam;
        let items = itemsParam;

        post.post_status = post.post_status || _.result(postToUpdate, 'post_status') || 'open';
        const dfds = [];

        if (items && items.length > 0) {
            // prepare the list of items if needed
            if (_.difference(_.keys(items[0]), ['residRef', 'item']).length === 0) {
                items = _.map(items, (item) => item.item);
            }
            // save every items
            _.each(items, (itemParam) => {
                let item = {};
                // because it fails when item has a `_id` field without `_links`

                if (angular.isDefined(items, '_id')) {
                    item = {
                        blog: blogId,
                        text: itemParam.text,
                        meta: itemParam.meta,
                        group_type: itemParam.group_type,
                        item_type: itemParam.item_type,
                        commenter: itemParam.meta && itemParam.meta.commenter,
                        syndicated_creator: itemParam.syndicated_creator,
                    };
                }
                dfds.push(api.items.save(item));
            });
        }
        // save the post
        return $q.all(dfds).then((items) => {
            if (dfds.length > 0) {
                angular.extend(post, {
                    blog: blogId,
                    groups: [
                        {
                            id: 'root',
                            refs: [{idRef: 'main'}],
                            role: 'grpRole:NEP',
                        }, {
                            id: 'main',
                            refs: [],
                            role: 'grpRole:Main',
                        },
                    ],
                });
                // update the post reference (links with items)
                _.each(items, (item) => {
                    post.groups[1].refs.push({residRef: item._id});
                });
            }
            let operation;

            if (angular.isDefined(postToUpdate)) {
                operation = function updatePost() {
                    return api.posts.save(postToUpdate, post);
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
        const deleted = {deleted: true};

        return savePost(post.blog, post, [], deleted);
    }

    return {
        getPosts: getPosts,
        getLatestUpdateDate: getLatestUpdateDate,
        retrievePost: retrievePost,
        savePost: savePost,
        saveDraft: function(blogId, post, items, sticky, highlight) {
            return savePost(
                blogId,
                post,
                items,
                {post_status: 'draft', sticky: sticky, lb_highlight: highlight}
            );
        },
        saveContribution: function(blogId, post, items, sticky, highlight) {
            return savePost(
                blogId,
                post,
                items,
                {post_status: 'submitted', sticky: sticky, lb_highlight: highlight}
            );
        },
        remove: removePost,
    };
}
