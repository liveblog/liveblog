define([
    'angular',
    'require',
    'superdesk-dashboard/workspace-controller'
], function(angular, require) {
    'use strict';

    return angular.module('liveblog.dashboard', ['superdesk.dashboard'])

    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/workspace', {
            label: gettext('Workspace'),
            controller: require('superdesk-dashboard/workspace-controller'),
            templateUrl: require.toUrl('superdesk-dashboard/views/workspace.html'),
            topTemplateUrl: require.toUrl('./views/workspace-topnav.html'),
            priority: -1000,
            category: superdesk.MENU_MAIN
        });
    }]);
});
