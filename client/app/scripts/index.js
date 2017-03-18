import 'lb-bootstrap.scss';

import 'jquery-ui/jquery-ui';
import 'jquery-jcrop';
import 'jquery-gridster';
// import 'moment-timezone';
import 'bootstrap';
import 'angular';
import 'angular-moment';
import 'angular-bootstrap-npm';
import 'angular-resource';
import 'angular-route';
import 'angular-gettext';
import 'angular-mocks';
import 'angular-animate';
import 'angular-embedly';
import 'angular-contenteditable';
import 'angular-vs-repeat';
import 'ng-file-upload';
import 'raven-js';
import 'rangy';
import 'rangy-saverestore';
import 'ment.io';
import 'angular-embed/dist/angular-embed';
import 'angular-contenteditable';
import 'angular-messages';
import 'lr-infinite-scroll';

import _ from 'lodash';
import moment from 'moment-timezone';

_.sortByOrder = require('lodash.sortbyorder');

// This is an ugly little hack required by the venerable superdesk.editor to work
import MediumEditor from 'medium-editor';
window.MediumEditor = MediumEditor;

import 'superdesk-core/scripts/core/activity';
import 'superdesk-core/scripts/core/analytics';
import 'superdesk-core/scripts/core/api';
import 'superdesk-core/scripts/core/auth';
import 'superdesk-core/scripts/core/beta';
import 'superdesk-core/scripts/core/datetime';
import 'superdesk-core/scripts/core/error';
import 'superdesk-core/scripts/core/elastic';
import 'superdesk-core/scripts/core/filters';
import 'superdesk-core/scripts/core/services';
import 'superdesk-core/scripts/core/directives';
import 'superdesk-core/scripts/core/editor2';
import 'superdesk-core/scripts/core/spellcheck';
import 'superdesk-core/scripts/core/editor3';
import 'superdesk-core/scripts/core/features';
import 'superdesk-core/scripts/core/list';
import 'superdesk-core/scripts/core/keyboard';
import 'superdesk-core/scripts/core/privileges';
import 'superdesk-core/scripts/core/notification';
import 'superdesk-core/scripts/core/itemList';
import 'superdesk-core/scripts/core/menu';
import 'superdesk-core/scripts/core/notify';
import 'superdesk-core/scripts/core/ui';
import 'superdesk-core/scripts/core/upload';
import 'superdesk-core/scripts/core/lang';
import 'superdesk-core/scripts/core/config';
import 'superdesk-core/scripts/core/loading';

import 'superdesk-core/scripts/apps/workspace';
import 'superdesk-core/scripts/apps/dashboard';
import 'superdesk-core/scripts/apps/users';
// import 'superdesk-core/scripts/apps/groups';
// import 'superdesk-core/scripts/apps/products';
import 'superdesk-core/scripts/apps/publish';
import 'superdesk-core/scripts/apps/templates';
import 'superdesk-core/scripts/apps/profiling';
import 'superdesk-core/scripts/apps/desks';
import 'superdesk-core/scripts/apps/authoring';
import 'superdesk-core/scripts/apps/search';
import 'superdesk-core/scripts/apps/legal-archive';
// import 'superdesk-core/scripts/apps/stream';
import 'superdesk-core/scripts/apps/packaging';
import 'superdesk-core/scripts/apps/highlights';
import 'superdesk-core/scripts/apps/translations';
import 'superdesk-core/scripts/apps/content-filters';
import 'superdesk-core/scripts/apps/dictionaries';
import 'superdesk-core/scripts/apps/vocabularies';
import 'superdesk-core/scripts/apps/archive';
import 'superdesk-core/scripts/apps/monitoring';
import 'superdesk-core/scripts/apps/settings';
import 'superdesk-core/scripts/apps/ingest';
import 'superdesk-core/scripts/apps/search-providers';

import 'liveblog-bloglist';
import 'liveblog-edit';
import 'liveblog-freetypes';
import 'liveblog-marketplace';
import 'liveblog-settings';
import 'liveblog-syndication';
import 'liveblog-themes';
import 'liveblog-analytics';
import 'liveblog-advertising';

import 'liveblog-security.service';

const config = __SUPERDESK_CONFIG__;

if (typeof window.superdeskConfig !== 'undefined') {
    angular.extend(config, window.superdeskConfig);
}

// Commented angular modules are not required to run liveblog
// But they are shown here to give a perspective of
// what is required to run liveblog
let sdCore = angular.module('superdesk.core', [
    'ngRoute',
    'ngResource',
    'ngFileUpload',

    'ui.bootstrap',

    'superdesk.core.activity',
    'superdesk.core.analytics',
    'superdesk.core.api',
    'superdesk.core.auth',
    'superdesk.core.datetime',
    'superdesk.core.elastic',
    'superdesk.core.error',
    'superdesk.core.notify',
    'superdesk.core.ui',
    'superdesk.core.upload',
    'superdesk.core.menu',
    'superdesk.core.filters',
    'superdesk.core.preferences',
    'superdesk.core.translate',
    'superdesk.core.workflow',
    'superdesk.core.loading',
    'superdesk.core.editor3',
    'superdesk.core.services',

    'superdesk.core.directives'
]);

angular.module('superdesk.apps', [
    'superdesk.apps.settings',
    'superdesk.apps.dashboard',
    'superdesk.apps.users',
    'superdesk.apps.users.import',
    'superdesk.apps.users.profile',
    'superdesk.apps.users.activity',
    'superdesk.apps.archive',
    'superdesk.apps.ingest',
    'superdesk.apps.desks',
    // 'superdesk.apps.groups',
    // 'superdesk.apps.products',
    'superdesk.apps.authoring',
    'superdesk.apps.packaging',
    'superdesk.apps.spellcheck',
    'superdesk.apps.notification',
    'superdesk.apps.highlights',
    'superdesk.apps.translations',
    'superdesk.apps.content_filters', // Can't remove
    'superdesk.apps.dictionaries',
    'superdesk.apps.vocabularies',
    // 'superdesk.apps.searchProviders',
    // 'superdesk.apps.stream',
    'superdesk.apps.publish', // Can't remove
    'superdesk.apps.templates',
    'superdesk.apps.monitoring',
    'superdesk.apps.profiling'
]);

angular.module('superdesk.config').constant('config', config);

let liveblogModules = [
    'liveblog.analytics',
    'liveblog.bloglist',
    'liveblog.edit',
    'liveblog.posts',
    'liveblog.blog',
    'liveblog.themes',
    'liveblog.freetypes',
    'liveblog.advertising',
    'ngMessages'
];

if (config.syndication) {
    liveblogModules.push('liveblog.syndication');
}

if (config.marketplace) {
    liveblogModules.push('liveblog.marketplace');
}

let liveblog = angular.module('liveblog', liveblogModules);

sdCore.constant('lodash', _);
sdCore.constant('moment', moment);

liveblog.constant('config', config);
liveblog.constant('lodash', _);
liveblog.constant('moment', moment);

liveblog.config(['$routeProvider', '$locationProvider', ($routeProvider, $locationProvider) => {
    $locationProvider.hashPrefix('');
    $routeProvider.when('/', {redirectTo: '/liveblog'});
}]);

liveblog.run(['$rootScope', '$timeout', 'notify', 'gettext', 'session',
    function($rootScope, $timeout, notify, gettext, session) {
        var alertTimeout;

        $rootScope.$on('disconnected', (event) => {
            $timeout.cancel(alertTimeout);
            if (session && session.sessionId) {
                alertTimeout = $timeout(() => {
                    notify.pop();
                    notify.error(gettext('Disconnected from Notification Server, attempting to reconnect ...'), 20000);
                }, 100);
            }
        });
        $rootScope.$on('connected', (event) => {
            // only show the 'connected' message if there was a disconnect event
            if (alertTimeout) {
                $timeout.cancel(alertTimeout);
                alertTimeout = $timeout(() => {
                    notify.pop();
                    notify.success(gettext('Connected to Notification Server!'));
                }, 100);
            }
        });
    }]);

let body = angular.element('body');

body.ready(() => {
    /**
     * @ngdoc module
     * @name superdesk-client
     * @packageName superdesk-client
     * @description The root superdesk module.
     */
    angular.bootstrap(body, [
        'superdesk.config',
        'superdesk.core',
        'superdesk.apps',
        'liveblog'
    ], {strictDi: true});

    window.superdeskIsReady = true;
});
