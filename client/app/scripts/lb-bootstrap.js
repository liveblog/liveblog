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
import 'superdesk-core/scripts/core/services/modalService';

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

//import superdesk from 'superdesk-core/scripts/superdesk/superdesk';

import 'liveblog-bloglist';
import 'liveblog-edit';
import 'liveblog-themes';
import 'liveblog-settings';

import 'liveblog-security.service';

import _ from 'lodash';
import moment from 'moment';
import config from './../../config';

let core = angular.module('superdesk.core', [
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

    // services/
    'superdesk.core.services.beta',
    'superdesk.core.services.data',
    'superdesk.core.services.modal',
    'superdesk.core.services.dragdrop',
    'superdesk.core.services.server',
    'superdesk.core.services.entity',
    'superdesk.core.services.permissions',
    'superdesk.core.services.storage',
    'superdesk.core.services.pageTitle',

    'superdesk.core.directives'

]);

angular.module('superdesk.config').constant('config', config);

//function bootstrap(config, apps) {

//    const superdesk = angular.module('superdesk');
//    apps.unshift(superdesk.name);
//    superdesk.constant('config', config);
//    superdesk.constant('lodash', _);
//    superdesk.constant('moment', moment);
//    // liveblog list must be the default page
//    superdesk.config(['$routeProvider', function($routeProvider) {
//        $routeProvider.when('/', {redirectTo: '/liveblog'});
//    }]);
//    superdesk.run(['$rootScope', '$timeout', 'notify', 'gettext', 'session', function($rootScope, $timeout, notify, gettext, session) {
//        var alertTimeout;
//        $rootScope.$on('disconnected', function(event) {
//            $timeout.cancel(alertTimeout);
//            if (session && session.sessionId) {
//                alertTimeout = $timeout(function() {
//                    notify.pop();
//                    notify.error(gettext('Disconnected from Notification Server, attempting to reconnect ...'), 20000);
//                }, 100);
//            }
//        });
//        $rootScope.$on('connected', function(event) {
//            //only show the 'connected' message if there was a disconnect event
//            if (alertTimeout) {
//                $timeout.cancel(alertTimeout);
//                alertTimeout = $timeout(function() {
//                    notify.pop();
//                    notify.success(gettext('Connected to Notification Server!'));
//                }, 100);
//            }
//        });
//    }]);
//    // load apps & bootstrap
//    var body = angular.element('body');
//    body.ready(function() {
//        angular.bootstrap(body, apps, {strictDi: true});
//        window.superdeskIsReady = true;
//    });
//};

//bootstrap(config, modules);

//angular.module('superdesk.config').constant('config', appConfig);
core.constant('config', config);
core.constant('lodash', _);
core.constant('moment', moment);

core.config(['$routeProvider', ($routeProvider) => {
    $routeProvider.when('/', {
        redirectTo: '/liveblog'
    });
}]);

//import 'superdesk-core/scripts/apps';

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
        //'superdesk.apps',

        'liveblog.bloglist',
        'liveblog.edit',
        'liveblog.posts',
        'liveblog.blog',
        'liveblog.themes',
        'ngMessages'
    ], {strictDi: true});

    window.superdeskIsReady = true;
});
