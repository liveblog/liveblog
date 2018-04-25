/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014, 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
import _ from 'lodash';

unreadPostsService.$inject = ['$rootScope'];

export default function unreadPostsService($rootScope) {
    let listener;
    let contributions = [];
    let prevContributions = [];
    let comments = [];
    let prevComments = [];
    // check if the post is an unread comment.

    function isComment(post) {
        return _.indexOf(prevComments, post._id) !== -1;
    }

    // check if the post is an unread contribution.
    function isContribution(post) {
        let isContrib = false;

        prevContributions.forEach((contrib) => {
            if (contrib.id === post._id) {
                isContrib = true;
            }
        });

        return isContrib;
    }

    // get the count of current contribution.
    function countContributions() {
        return contributions.length;
    }

    // get the count of current comments.
    function countComments() {
        return comments.length;
    }

    // reset the current state and keep the previous vector.
    function reset(panel) {
        if (panel === 'contributions') {
            prevContributions = contributions;
            contributions = [];
        }
        if (panel === 'comments') {
            prevComments = comments;
            comments = [];
        }
    }

    // add the post in the contributions vector.
    function onPostReceive(e, eventParams) {
        if (eventParams.posts && eventParams.posts[0].syndication_in) {
            return;
        }

        if (eventParams.post_status === 'comment') {
            comments = comments.concat(eventParams.posts);
        }

        if (eventParams.post_status === 'submitted') {
            contributions = contributions.concat(eventParams.posts);
        }

        if (eventParams.updated) {
            // Update unread comment array
            eventParams.posts.forEach((post) => {
                comments = comments
                    .filter((comment) => comment.id !== post._id);
            });
        }
    }
    return {
        isContribution: isContribution,
        countContributions: countContributions,
        isComment: isComment,
        countComments: countComments,
        reset: reset,
        startListening: function() {
            if (!listener) {
                listener = $rootScope.$on('posts', onPostReceive);
            }
        },
        stopListening: function() {
            reset();
            if (listener) {
                listener();
                listener = undefined;
            }
        },
    };
}
