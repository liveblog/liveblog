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
var paths = {superdesk: 'bower_components/superdesk/client/app/scripts/'};
// we have to put here files tested without requirejs
// core
tests.push('superdesk/mocks');
tests.push('superdesk/api/api');
tests.push('superdesk/auth/auth');
tests.push('superdesk/menu/menu');
tests.push('superdesk/config/config');
tests.push('superdesk/editor/editor');
tests.push('superdesk/notify/notify');
tests.push('superdesk/activity/activity');
tests.push('superdesk/menu/notifications/notifications');
tests.push('superdesk/services/translate');
tests.push('superdesk/services/modalService');
tests.push('superdesk/services/preferencesService');
tests.push('superdesk/features/features');
tests.push('superdesk/services/asset');
tests.push('superdesk/privileges/privileges');
tests.push('superdesk/beta/beta');
tests.push('superdesk/services/storage');

// apps
tests.push('superdesk-authoring/authoring');
tests.push('superdesk-authoring/widgets/widgets');
tests.push('superdesk-authoring/comments/comments');
tests.push('superdesk-authoring/workqueue/workqueue');
tests.push('superdesk-authoring/metadata/metadata');
tests.push('superdesk-authoring/versioning/versions');
tests.push('superdesk-workspace/content/content');
tests.push('superdesk-desks/module');
tests.push('superdesk-groups/groups');
tests.push('superdesk-search/search');

tests.push('superdesk-users/users');
tests.push('superdesk-users/profile');
tests.push('superdesk-users/activity/activity');
tests.push('superdesk-users/import/import');

tests.push('liveblog-dashboard/module');

tests.push('superdesk-dashboard/module');
tests.push('superdesk-dashboard/workspace-tasks/tasks');

tests.push('superdesk-archive/module');

tests.push('liveblog-dashboard/module');
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
        lodash: 'bower_components/lodash/lodash',
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
        'superdesk-authoring': paths.superdesk + 'superdesk-authoring',
        'superdesk-desks': paths.superdesk + 'superdesk-desks',
        'superdesk-archive': paths.superdesk + 'superdesk-archive',
        'superdesk-workspace': paths.superdesk + 'superdesk-workspace',
        'superdesk-groups': paths.superdesk + 'superdesk-groups',
        'superdesk-search': paths.superdesk + 'superdesk-search',
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
