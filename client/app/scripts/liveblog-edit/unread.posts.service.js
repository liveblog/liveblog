/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014, 2015 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */
define([
    'angular',
    'lodash',
    './module'
], function(angular, _) {
    'use strict';
    UnreadPostsService.$inject = [
        '$rootScope'
    ];
    function UnreadPostsService($rootScope) {
        var listener;
        var contributions = [],
            prevContributions = [],
            comments = [],
            prevComments = [];
        // check if the post is an unread comment.
        function isComment(post) {
            return _.indexOf(prevComments, post._id) !== -1;
        }

        // check if the post is an unread contribution.
        function isContribution(post) {
            var isContrib = false;

            prevContributions.forEach(function(contrib) {
                if (contrib.id == post._id)
                    isContrib = true;
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
        function onPostReceive(e, event_params) {
            if (event_params.posts[0].syndication_in) {
                return;
            }

            if (event_params.post_status === 'comment') {
                comments = comments.concat(event_params.posts);
            }

            if (event_params.post_status === 'submitted') {
                contributions = contributions.concat(event_params.posts);
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
            }
        };
    }
    angular.module('liveblog.posts')
        .service('unreadPostsService', UnreadPostsService);
});
// EOF
