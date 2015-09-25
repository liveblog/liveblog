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
    './module'
], function(angular) {
    'use strict';
    UnreadPostsService.$inject = [
        '$rootScope'
    ];
    function UnreadPostsService($rootScope) {
        var panelState = 'default', unreadContributions = 0;
        function setPanelState(newPanelState) {
            panelState = newPanelState;
        }
        function getUnreadContributions() {
            return unreadContributions;
        }
        function resetUnreadContributions() {
            unreadContributions = 0;
        }
        //increase the number of unread contributions
        $rootScope.$on('posts', function(e, event_params) {
            if (panelState !== 'contributions' && event_params.post_status === 'submitted') {
                unreadContributions ++;
            }
        });
        return {
            setPanelState: setPanelState,
            getUnreadContributions: getUnreadContributions,
            resetUnreadContributions: resetUnreadContributions
        };
    }
    angular.module('liveblog.posts')
        .service('unreadPostsService', UnreadPostsService);
});
// EOF
