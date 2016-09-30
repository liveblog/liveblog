/**
 * This file is part of Superdesk.
 *
 * Copyright 2013, 2014 Sourcefabric z.u. and contributors.
 *
 * For the full copyright and license information, please see the
 * AUTHORS and LICENSE files distributed with this source code, or
 * at https://www.sourcefabric.org/superdesk/license
 */

'use strict';
// loaded already
//define('jquery', [], function() {
//    'use strict';
//    return window.jQuery;
//});

//// loaded already
//define('angular', [], function() {
//    'use strict';
//    return window.angular;
//});

import gettext from 'angular-gettext';
import moment from 'moment';
import angular from 'angular';
import superdesk from 'superdesk-core';

//define('main', [
//    'gettext',
//    'angular',
//    'superdesk/superdesk',
//    'lodash',
//    'moment'
//], function(gettext, angular, superdesk, _, moment) {

    export default function bootstrap(config, apps) {

        apps.unshift(superdesk.name);
        superdesk.constant('config', config);
        superdesk.constant('lodash', _);
        superdesk.constant('moment', moment);
        // liveblog list must be the default page
        superdesk.config(['$routeProvider', function($routeProvider) {
            $routeProvider.when('/', {redirectTo: '/liveblog'});
        }]);
        superdesk.config(['$provide', function($provide) {
            $provide.decorator('sdItemGlobalsearchDirective', ['$delegate', function($delegate) {
                //remove from Liveblog the SD directive that is doing the ctrl+0 binding
                $delegate.shift();
                return $delegate;
            }]);
        }])
        //show messages on websocket disconnect and connect
        .run(['$rootScope', '$timeout', 'notify', 'gettext', 'session', function($rootScope, $timeout, notify, gettext, session) {
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
//});
