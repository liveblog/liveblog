import 'lb-bootstrap.scss';

import 'jquery-ui/jquery-ui';
import 'bootstrap';
import 'angular';
import 'angular-bootstrap-npm';
import 'angular-resource';
import 'angular-route';
import 'ng-file-upload';
import 'angular-gettext';
import 'angular-vs-repeat';
import 'angular-embedly';
import 'angular-embed/dist/angular-embed';
import 'angular-contenteditable';
import 'angular-messages';
import 'lodash';
import 'lr-infinite-scroll';
import 'ment.io';

// This is an ugly little hack required by the venerable superdesk.editor to work
import MediumEditor from 'medium-editor';
window.MediumEditor = MediumEditor;

//// core
//import 'superdesk-core/scripts/core/activity';
//import 'superdesk-core/scripts/core/analytics';
//import 'superdesk-core/scripts/core/api';
//import 'superdesk-core/scripts/core/auth';
//import 'superdesk-core/scripts/core/beta';
//import 'superdesk-core/scripts/core/datetime';
//import 'superdesk-core/scripts/core/error';
//import 'superdesk-core/scripts/core/elastic';
//import 'superdesk-core/scripts/core/filters';
//import 'superdesk-core/scripts/core/services';
//import 'superdesk-core/scripts/core/directives';
//import 'superdesk-core/scripts/core/features';
//import 'superdesk-core/scripts/core/list';
//import 'superdesk-core/scripts/core/keyboard';
//import 'superdesk-core/scripts/core/privileges';
//import 'superdesk-core/scripts/core/notification';
//import 'superdesk-core/scripts/core/itemList';
//import 'superdesk-core/scripts/core/menu';
//import 'superdesk-core/scripts/core/notify';
//import 'superdesk-core/scripts/core/ui';
//import 'superdesk-core/scripts/core/upload';
//import 'superdesk-core/scripts/core/lang';
//import 'superdesk-core/scripts/core/config';

//import 'superdesk-core/scripts/apps/workspace';
//import 'superdesk-core/scripts/apps/dashboard';
//import 'superdesk-core/scripts/apps/users';
//import 'superdesk-core/scripts/apps/groups';
//import 'superdesk-core/scripts/apps/products';
//import 'superdesk-core/scripts/apps/publish';
//import 'superdesk-core/scripts/apps/templates';
//import 'superdesk-core/scripts/apps/profiling';
//import 'superdesk-core/scripts/apps/desks';
//import 'superdesk-core/scripts/apps/authoring';
//import 'superdesk-core/scripts/apps/search';
//import 'superdesk-core/scripts/apps/legal-archive';
//import 'superdesk-core/scripts/apps/stream';
//import 'superdesk-core/scripts/apps/packaging';
//import 'superdesk-core/scripts/apps/highlights';
//import 'superdesk-core/scripts/apps/content-filters';
//import 'superdesk-core/scripts/apps/dictionaries';
//import 'superdesk-core/scripts/apps/vocabularies';
//import 'superdesk-core/scripts/apps/archive';
//import 'superdesk-core/scripts/apps/monitoring';
//import 'superdesk-core/scripts/apps/settings';
//import 'superdesk-core/scripts/apps/ingest';
//import 'superdesk-core/scripts/apps/search-providers';

//import 'liveblog-bloglist';
//import 'liveblog-edit';
//import 'liveblog-themes';
//import 'liveblog-settings';

//import 'liveblog-security.service';

//import './lb-templates';
//import './lb-bootstrap';
import 'superdesk-core/scripts/core/activity';
import 'superdesk-core/scripts/core/analytics';
import 'superdesk-core/scripts/core/api';
import 'superdesk-core/scripts/core/auth';
import 'superdesk-core/scripts/core/beta';
import 'superdesk-core/scripts/core/datetime';
import 'superdesk-core/scripts/core/error';
import 'superdesk-core/scripts/core/elastic';
import 'superdesk-core/scripts/core/filters';

//import 'superdesk-core/scripts/core/services';
//import 'superdesk-core/scripts/core/services/modalService';
import 'superdesk-core/scripts/core/services/translate';
import 'superdesk-core/scripts/core/services/preferencesService';
import 'superdesk-core/scripts/core/services/permissionsService';
import 'superdesk-core/scripts/core/services/data';
import 'superdesk-core/scripts/core/services/entity';
import 'superdesk-core/scripts/core/services/server';
import 'superdesk-core/scripts/core/services/storage';
import 'superdesk-core/scripts/core/services/dragDropService';
import 'superdesk-core/scripts/core/services/modalService';
import 'superdesk-core/scripts/core/services/workflowService';
import 'superdesk-core/scripts/core/services/asset';
import 'superdesk-core/scripts/core/services/image-factory';
import 'superdesk-core/scripts/core/services/pageTitle';

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
import 'liveblog-bloglist';
import 'liveblog-edit';
import 'liveblog-themes';
import 'liveblog-settings';

import 'liveblog-security.service';


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
        //'liveblog.edit',
        //'liveblog.posts',
        //'liveblog.blog',
        //'liveblog.themes',
        'ngMessages'
    ], {strictDi: true});

    window.superdeskIsReady = true;
});
