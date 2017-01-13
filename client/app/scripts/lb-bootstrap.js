//import superdesk from 'superdesk-core/scripts/superdesk/superdesk';

import _ from 'lodash';
import moment from 'moment';
import config from './../../config';

var modules = [
    'liveblog.bloglist',
    'liveblog.edit',
    'liveblog.posts',
    'liveblog.blog',
    'liveblog.themes',
    'superdesk.settings',
    'superdesk.dashboard',
    'superdesk.users',
    'superdesk.archive',
    'superdesk.archive.directives',
    'superdesk.ingest',
    'superdesk.desks',
    'superdesk.groups',
    'superdesk.authoring',
    'superdesk.authoring.multiedit',
    'superdesk.packaging',
    //'superdesk.editor2',
    //'superdesk.editor.spellcheck',
    'superdesk.notification',
    'superdesk.highlights',
    'superdesk.content_filters',
    'superdesk.dictionaries',
    'superdesk.vocabularies',
    'superdesk.users.import',
    'superdesk.users.profile',
    'superdesk.users.activity',
    'superdesk.stream',
    'superdesk.publish',
    'superdesk.templates',
    'superdesk.monitoring',
    'superdesk.loading',
    //'lb.templates',
    'ngMessages'
];

angular.module('superdesk.config').constant('config', config);

function bootstrap(config, apps) {

    const superdesk = angular.module('superdesk');
    apps.unshift(superdesk.name);
    superdesk.constant('config', config);
    superdesk.constant('lodash', _);
    superdesk.constant('moment', moment);
    // liveblog list must be the default page
    superdesk.config(['$routeProvider', function($routeProvider) {
        $routeProvider.when('/', {redirectTo: '/liveblog'});
    }]);
    //superdesk.config(['$provide', function($provide) {
    //    $provide.decorator('sdItemGlobalsearchDirective', ['$delegate', function($delegate) {
    //        //remove from Liveblog the SD directive that is doing the ctrl+0 binding
    //        $delegate.shift();
    //        return $delegate;
    //    }]);
    //}])
    //show messages on websocket disconnect and connect
    superdesk.run(['$rootScope', '$timeout', 'notify', 'gettext', 'session', function($rootScope, $timeout, notify, gettext, session) {
        var alertTimeout;
        $rootScope.$on('disconnected', function(event) {
            $timeout.cancel(alertTimeout);
            if (session && session.sessionId) {
                alertTimeout = $timeout(function() {
                    notify.pop();
                    notify.error(gettext('Disconnected from Notification Server, attempting to reconnect ...'), 20000);
                }, 100);
            }
        });
        $rootScope.$on('connected', function(event) {
            //only show the 'connected' message if there was a disconnect event
            if (alertTimeout) {
                $timeout.cancel(alertTimeout);
                alertTimeout = $timeout(function() {
                    notify.pop();
                    notify.success(gettext('Connected to Notification Server!'));
                }, 100);
            }
        });
    }]);
    // load apps & bootstrap
    var body = angular.element('body');
    body.ready(function() {
        angular.bootstrap(body, apps, {strictDi: true});
        window.superdeskIsReady = true;
    });
};

bootstrap(config, modules);
