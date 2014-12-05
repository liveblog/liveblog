var tests = [];
var APP_SPEC_REG_EXP = /^\/base\/app\/scripts\/(.*)\.js$/;

for (var file in window.__karma__.files) {
    if (window.__karma__.files.hasOwnProperty(file)) {
        if (/[sS]pec\.js$/.test(file)) {
            var matches = APP_SPEC_REG_EXP.exec(file);
            if (matches && matches.length === 2) {
                tests.push(matches[1]);
            } else {
                tests.push(file);
            }
        }
    }
}
var paths = {superdesk: 'bower_components/superdesk/app/scripts/'};
// we have to put here files tested without requirejs
// core
tests.push(paths.superdesk + 'superdesk/mocks');
tests.push(paths.superdesk + 'superdesk/api/api');
tests.push(paths.superdesk + 'superdesk/auth/auth');
tests.push(paths.superdesk + 'superdesk/menu/menu');
tests.push(paths.superdesk + 'superdesk/config/config');
tests.push(paths.superdesk + 'superdesk/editor/editor');
tests.push(paths.superdesk + 'superdesk/notify/notify');
tests.push(paths.superdesk + 'superdesk/activity/activity');
tests.push(paths.superdesk + 'superdesk/menu/notifications/notifications');
tests.push(paths.superdesk + 'superdesk/services/translate');
tests.push(paths.superdesk + 'superdesk/services/modalService');
tests.push(paths.superdesk + 'superdesk/services/preferencesService');
tests.push(paths.superdesk + 'superdesk/features/features');
tests.push(paths.superdesk + 'superdesk/services/asset');
tests.push(paths.superdesk + 'superdesk/privileges/privileges');
tests.push(paths.superdesk + 'superdesk/beta/beta');
tests.push(paths.superdesk + 'superdesk/services/storage');

// apps
tests.push(paths.superdesk + 'superdesk-authoring/authoring');
tests.push(paths.superdesk + 'superdesk-authoring/widgets/widgets');
tests.push(paths.superdesk + 'superdesk-authoring/comments/comments');
tests.push(paths.superdesk + 'superdesk-authoring/workqueue/workqueue');
tests.push(paths.superdesk + 'superdesk-authoring/metadata/metadata');
tests.push(paths.superdesk + 'superdesk-authoring/versioning/versions');
tests.push(paths.superdesk + 'superdesk-workspace/content/content');
tests.push(paths.superdesk + 'superdesk-desks/module');
tests.push(paths.superdesk + 'superdesk-groups/groups');
tests.push(paths.superdesk + 'superdesk-search/search');

tests.push(paths.superdesk + 'superdesk-users/users');
tests.push(paths.superdesk + 'superdesk-users/profile');
tests.push(paths.superdesk + 'superdesk-users/activity/activity');
tests.push(paths.superdesk + 'superdesk-users/import/import');

tests.push(paths.superdesk + 'superdesk-dashboard/module');
tests.push(paths.superdesk + 'superdesk-dashboard/workspace-tasks/tasks');

tests.push(paths.superdesk + 'superdesk-archive/module');

// libs
tests.push('bower_components/ment.io/dist/mentio');
tests.push('angular-gettext');
tests.push('angular-ui');
tests.push('angular-route');

requirejs.config({
    baseUrl: '/base/app/scripts',
    deps: ['angular-mocks', 'gettext', 'angular'],

    callback: function() {
        'use strict';
        require(tests, window.__karma__.start);
    },

    paths: {
        jquery: 'bower_components/jquery/dist/jquery',
        bootstrap: 'bower_components/bootstrap/js',
        angular: 'bower_components/angular/angular',
        moment: 'bower_components/momentjs/moment',
        lodash: 'bower_components/lodash/dist/lodash',
        d3: 'bower_components/d3/d3',
        'angular-resource': 'bower_components/angular-resource/angular-resource',
        'angular-gettext': 'bower_components/angular-gettext/dist/angular-gettext',
        'angular-route': 'bower_components/angular-route/angular-route',
        'angular-mocks': 'bower_components/angular-mocks/angular-mocks',
        'angular-ui': 'bower_components/angular-bootstrap/ui-bootstrap',
        'moment-timezone': 'bower_components/moment-timezone/moment-timezone',

        'superdesk': paths.superdesk + 'superdesk',
        'superdesk-settings': paths.superdesk + 'superdesk-settings',
        'superdesk-dashboard': paths.superdesk + 'superdesk-dashboard',
        'superdesk-users': paths.superdesk + 'superdesk-users',
        'superdesk-scratchpad': paths.superdesk + 'superdesk-scratchpad'
    },

    shim: {
        jquery: {
            exports: 'jQuery'
        },

        angular: {
            exports: 'angular',
            deps: ['jquery']
        },

        'angular-resource': ['angular'],
        'angular-gettext': ['angular'],
        'angular-route': ['angular'],
        'angular-mocks': ['angular'],
        'angular-ui': ['angular']
    }
});
