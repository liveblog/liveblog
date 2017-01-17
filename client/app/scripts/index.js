import 'lb-bootstrap.scss';

import 'jquery-ui/jquery-ui';
import 'jquery-jcrop';
import 'jquery-gridster';
import 'moment-timezone';
import 'lodash';
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
//import 'angular-embed';
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
import 'superdesk-core/scripts/apps/groups';
import 'superdesk-core/scripts/apps/products';
import 'superdesk-core/scripts/apps/publish';
import 'superdesk-core/scripts/apps/templates';
import 'superdesk-core/scripts/apps/profiling';
import 'superdesk-core/scripts/apps/desks';
import 'superdesk-core/scripts/apps/authoring';
import 'superdesk-core/scripts/apps/search';
import 'superdesk-core/scripts/apps/legal-archive';
import 'superdesk-core/scripts/apps/stream';
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
    'superdesk.apps.groups',
    'superdesk.apps.products',
    'superdesk.apps.authoring',
    'superdesk.apps.packaging',
    'superdesk.apps.editor2',
    'superdesk.apps.spellcheck',
    'superdesk.apps.notification',
    'superdesk.apps.highlights',
    'superdesk.apps.translations',
    'superdesk.apps.content_filters',
    'superdesk.apps.dictionaries',
    'superdesk.apps.vocabularies',
    'superdesk.apps.searchProviders',
    'superdesk.apps.stream',
    'superdesk.apps.publish',
    'superdesk.apps.templates',
    'superdesk.apps.monitoring',
    'superdesk.apps.profiling'
]);

angular.module('superdesk.config').constant('config', config);

core.constant('config', config);
core.constant('lodash', _);
core.constant('moment', moment);

core.config(['$routeProvider', ($routeProvider) => {
    $routeProvider.when('/', {
        redirectTo: '/liveblog'
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

        'liveblog.bloglist',
        'liveblog.edit',
        'liveblog.posts',
        'liveblog.blog',
        'liveblog.themes',
        'ngMessages'
    ], {strictDi: true});

    window.superdeskIsReady = true;
});
