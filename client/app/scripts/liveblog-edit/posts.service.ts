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
import moment, { Moment } from 'moment';
import { IFilters } from './types';

const postsService = (api, $q, _userList, session) => {
    const filterPosts = (filters: IFilters, postsCriteria) => {
        const filter = postsCriteria.source.query.filtered.filter;

        if (angular.isDefined(filters.status)) {
            filter.and.push({ term: { post_status: filters.status } });
        }

        if (angular.isDefined(filters.sticky)) {
            filter.and.push({ term: { sticky: filters.sticky } });
        }

        if (filters?.authors?.length > 0) {
            filter.and.push({
                or: {
                    filters: filters.authors.map((author) => ({ term: { original_creator: author } })),
                },
            });
        }

        const range = {};

        if (filters.updatedAfter) {
            range['_updated'] = { gt: filters.updatedAfter };
        }

        if (Object.keys(range).length > 0) {
            filter.and.push({ range: range });
        }

        if (angular.isDefined(filters.highlight)) {
            filter.and.push({ term: { lb_highlight: filters.highlight } });
        }

        const excludeScheduled = typeof filters.status === 'undefined' || filters.status === 'open';

        if (excludeScheduled) {
            postsCriteria.source.post_filter = getPostFilters(filters);
        }
    };

    const getPostFilters = (filters: IFilters) => {
        const operator = filters.scheduled ? 'gte' : 'lte';
        const postFilterRange = {};
        // eslint-disable-next-line newline-per-chained-call
        const publishedDate = filters.maxPublishedDate || moment().utc().format();

        postFilterRange['published_date'] = {};
        postFilterRange['published_date'][operator] = publishedDate;

        return { range: postFilterRange };
    };

    /**
     * Using recursiveDeepCopy approach since it's performant than JSON.stringify
     * and it allows having functions within the cloned object
     * https://jsperf.com/deep-copy-vs-json-stringify-json-parse/5
     * TODO: move this outside as can be used somewhere else.
     */
    const recursiveDeepCopy = (o) => {
        let newObj;
        let i;

        if (moment.isMoment(o)) {
            return o.clone();
        }

        // tslint:disable-next-line:curly
        if (typeof o !== 'object' || !o) return o;

        // eslint-disable-next-line yoda
        if ('[object Array]' === Object.prototype.toString.apply(o)) {
            newObj = [];
            for (i = 0; i < o.length; i += 1) {
                newObj[i] = recursiveDeepCopy(o[i]);
            }
            return newObj;
        }

        newObj = {};
        for (i in o) {
            if (_.has(o, i)) {
                newObj[i] = recursiveDeepCopy(o[i]);
            }
        }

        return newObj;
    };

    /**
     * Fetch a page of posts
     * @param {string} blog_id - The id of the blog
     * @param {object} filters - (available: {boolean} 'status', {string} 'updatedAfter')
     * @param {integer} max_results - maximum number of results per page
     * @param {integer} page - page index
     */
    const getPosts = (blogId, filters: IFilters = {}, maxResults = 15, page = 1) => {
        // excludeDeleted: default set to true
        filters.excludeDeleted = angular.isDefined(filters.excludeDeleted) ? filters.excludeDeleted : true;

        const postsCriteria: any = {
            source: {
                query: {
                    filtered: {
                        filter: {
                            and: [],
                        },
                    },
                },
            },
            page: page,
            max_results: maxResults,
        };

        // filters.excludeDeleted
        if (filters.excludeDeleted) {
            postsCriteria.source.query.filtered.filter.and.push({ not: { term: { deleted: true } } });
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

            sort[filters.sort] = { order: order, missing: '_last', unmapped_type: 'long' };
            postsCriteria.source.sort = [sort];
        }

        filterPosts(filters, postsCriteria);

        if (angular.isDefined(filters.syndicationIn)) {
            postsCriteria.source.query.filtered.filter.and.push({
                term: { syndication_in: filters.syndicationIn },
            });
        }

        if (angular.isDefined(filters.noSyndication)) {
            postsCriteria.source.query.filtered.filter.and.push({
                missing: { field: 'syndication_in' },
            });
            postsCriteria.source.query.filtered.filter.or = [{
                exists: { field: 'unpublished_date' },
            }];
        }

        return retrievePosts(blogId, postsCriteria);
    };

    /**
     * This method will fetch the information of the creator of the post
     * or item and will attach it to the item object in order to access the user's
     * information later (profile_url, name, etc)
     *
     * @param       {Object} obj         Post or item belonging to post
     *
     * @TODO: remove this in next release as it's all coming from backend
     */
    const _completeUser = (obj) => {
        if (obj.commenter) {
            obj.user = { display_name: obj.commenter };
        } else if (obj.syndicated_creator) {
            obj.user = obj.syndicated_creator;
        } else if (typeof obj.original_creator === 'object') {
            obj.user = obj.original_creator;
        }

        return obj;
    };

    const _completePost = (post) => {
        let multipleItems: any = false;

        if (post.groups[1].refs.length > 1) {
            multipleItems = post.groups[1].refs.length - 1;
        }

        return $q((resolve) => {
            angular.extend(post, {
                multipleItems: multipleItems,
                // add a `mainItem` field containing the first item
                mainItem: post.groups[1].refs[0] || { item: {} },
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
            post.mainItem.item.user = post.original_creator;

            if (!post.mainItem.item.user) {
                const mainItem = recursiveDeepCopy(post.mainItem.item);

                post.mainItem.item.user = _completeUser(mainItem).user;
            }

            resolve(post);
        });
    };

    const retrievePost = (postId) => {
        return api.posts.getById(postId)
            .then(_completePost)
            .then((post) => post);
    };

    const retrieveSyndications = (posts) => {
        const syndIds = [];

        // This means the syndication module is not enabled
        if (!_.has(api, 'syndicationIn')) {
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
    };

    const retrievePosts = (blogId, postsCriteria) => {
        return api('blogs/<regex("[a-f0-9]{24}"):blog_id>/posts', { _id: blogId })
            .query(postsCriteria)
            .then(retrieveSyndications)
            .then((data) => $q.all(data._items.map(_completePost))
                .then((result) => angular.extend(data, { _items: result })));
    };

    const getLatestUpdateDate = (posts) => {
        if (!angular.isDefined(posts) || posts.length < 1) {
            return;
        }

        let latestDate: Moment;
        let date: Moment;

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
    };

    const savePost = (blogId, postToUpdate, itemsParam: any[], post: any = {}) => {
        let items = itemsParam;
        const savePromises = [];

        post.post_status = post.post_status || _.result(postToUpdate, 'post_status') || 'open';

        if (items && items.length > 0) {
            // prepare the list of items if needed
            if (_.difference(_.keys(items[0]), ['residRef', 'item']).length === 0) {
                items = _.map(items, (item) => item.item);
            }

            // save every items
            _.each(items, (itemParam) => {
                switch (itemParam.item_type) {
                case 'poll': {
                    const poll = {
                        blog: blogId,
                        poll_body: itemParam.poll_body,
                    };

                    if (angular.isDefined(itemParam.id_to_update)) {
                        const pollPromise = api.polls.getById(itemParam.id_to_update).then((pollToUpdate) => {
                            // Update the poll answers from editor since they new votes could have been added
                            // since initial poll creation or subsequent updates
                            poll.poll_body.answers = pollToUpdate.poll_body.answers;
                            return api.polls.save(pollToUpdate, poll);
                        })
                        savePromises.push(pollPromise);
                    } else {
                        savePromises.push(api.polls.save(poll));
                    }

                    break;
                }
                default: {
                    const item = {
                        blog: blogId,
                        text: itemParam.text,
                        meta: itemParam.meta,
                        group_type: itemParam.group_type,
                        item_type: itemParam.item_type,
                        commenter: itemParam.meta && itemParam.meta.commenter,
                        syndicated_creator: itemParam.syndicated_creator,
                    };

                    savePromises.push(api.items.save(item));
                    break;
                }
                }
            });
        }

        // save the post
        return $q.all(savePromises).then((itemsList) => {
            if (savePromises.length > 0) {
                angular.extend(post, {
                    blog: blogId,
                    groups: [
                        {
                            id: 'root',
                            refs: [{ idRef: 'main' }],
                            role: 'grpRole:NEP',
                        }, {
                            id: 'main',
                            refs: [],
                            role: 'grpRole:Main',
                        },
                    ],
                });

                // update the post reference (links with itemsList)
                _.each(itemsList, (item) => {
                    switch (item.item_type) {
                    case 'poll':
                        post.groups[1].refs.push({ residRef: item._id, location: 'polls', type: 'poll' });
                        break;
                    default:
                        post.groups[1].refs.push({ residRef: item._id });
                        break;
                    }
                });
            }

            let operation;

            if (angular.isDefined(postToUpdate)) {
                operation = () => api.posts.save(postToUpdate, post);
            } else {
                operation = () => api.posts.save(post);
            }

            // return the post saved
            return operation();
        });
    };

    const removePost = (post) => {
        const removeParams = { deleted: true };

        const items = post.groups[1].refs;
        const deletePromises = [];

        _.each(items, (item) => {
            switch (item.item.item_type) {
            case 'poll': {
                deletePromises.push(
                    api.polls.getById(item.residRef).then((pollToDelete) => {
                        return api.polls.remove(pollToDelete);
                    })
                );
                break;
            }
            default: {
                deletePromises.push(
                    api.items.getById(item.residRef).then((itemToDelete) => {
                        return api.items.remove(itemToDelete);
                    })
                );
                break;
            }
            }
        });

        return $q.all(deletePromises).then(() => {
            angular.extend(removeParams, {
                groups: [
                    {
                        id: 'root',
                        refs: [{ idRef: 'main' }],
                        role: 'grpRole:NEP',
                    }, {
                        id: 'main',
                        refs: [],
                        role: 'grpRole:Main',
                    },
                ],
            });

            return api.posts.save(post, removeParams);
        });
    };

    const flagPost = (postId) => {
        return api('post_flags').save({ postId: postId });
    };

    const removeFlagPost = (flag) => {
        api('post_flags').remove(flag);
    };

    const syncRemoveFlag = (url, etag) => {
        // NOTE: avoid using Promise as we are triggering this
        // when unload & onunload window event. If we use a promise,
        // the browser will kill the thread before the request is triggered
        fetch(url, {
            method: 'DELETE',
            headers: {
                Authorization: localStorage.getItem('sess:token'),
                'Content-Type': 'application/json',
                'If-Match': etag,
            },
            keepalive: true,
        });
    };

    const setFlagTimeout = (post, callback) => {
        // perhaps not the best place to put this but I needed this
        // to be accessible from different directives. If there is another/better way
        // please improve this ;)
        const editFlag = post.edit_flag;
        const current = moment().utc();
        const flatExpireAt = moment(editFlag.expireAt);
        const seconds = flatExpireAt.diff(current, 'seconds');
        const key = `flagTimeout_${editFlag.postId}`;

        // if flag is already expired, let's remove id right away
        if (seconds < 0) {
            removeFlagPost(editFlag);
            return;
        }

        // try to remove previous timeout just in case
        clearTimeout(window[key]);

        window[key] = setTimeout(() => {
            post.edit_flag = undefined;

            callback();

            // then remove also from backend if user is editing
            if (editFlag.users.indexOf(session.identity) !== -1) {
                removeFlagPost(editFlag);
            }
        }, seconds * 1000);
    };

    const saveWithStatus = (status) =>
        (blogId, post, items, sticky, highlight) =>
            savePost(
                blogId,
                post,
                items,
                { post_status: status, sticky: sticky, lb_highlight: highlight }
            );

    return {
        getPosts: getPosts,
        getLatestUpdateDate: getLatestUpdateDate,
        retrievePost: retrievePost,
        savePost: savePost,
        flagPost: flagPost,
        removeFlagPost: removeFlagPost,
        syncRemoveFlag: syncRemoveFlag,
        setFlagTimeout: setFlagTimeout,
        saveDraft: saveWithStatus('draft'),
        saveContribution: saveWithStatus('submitted'),
        saveScheduledPost: saveWithStatus('scheduled'),
        remove: removePost,
    };
};

postsService.$inject = [
    'api',
    '$q',
    'userList',
    'session',
];

export default postsService;
