/* global ace */

import generalTpl from 'scripts/liveblog-settings/views/general.ng1';
import instanceTpl from 'scripts/liveblog-settings/views/instance-settings.ng1';
import LiveblogSettingsController from './controllers/general-settings.ts';
import LiveblogInstanceSettingsController from './controllers/instance-settings.ts';
import {renderTagsManager} from './components/tagsManager';
import {lbSettingsView} from './directives/lbSettingsView';
import loginScreenTpl from '../liveblog-registration/login-screen.html';

const liveblogSettings = angular.module('liveblog.settings', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/', {
                label: gettext('Liveblog Settings'),
                controller: angular.noop,
                category: superdesk.MENU_MAIN,
                priority: 1000,
                adminTools: true,
                _settings: 1,
                privileges: {global_preferences: 1},
            })
            .activity('/settings/general', {
                label: gettext('General Settings'),
                controller: LiveblogSettingsController,
                templateUrl: generalTpl,
                category: superdesk.MENU_SETTINGS,
                liveblogSetting: true,
                privileges: {global_preferences: 1},
            })
            .activity('/settings/instance-settings', {
                label: gettext('Instance Settings'),
                controller: LiveblogInstanceSettingsController,
                templateUrl: instanceTpl,
                category: superdesk.MENU_SETTINGS,
                privileges: {global_preferences: 1},
                liveblogSetting: true,
                liveblogSupportTools: true,
            });
    }])
    .config(['$provide', function($provide) {
        $provide.decorator('sdLoginModalDirective', ['$delegate', function($delegate) {
            $delegate[0].template = loginScreenTpl;
            return $delegate;
        }]);

        // superdesk-core's usersService.save uses api.save('users', ...). The
        // function form bypasses the apiProvider.api('users') override below
        // and posts to /api/users, dropping tenant_id injection. Route through
        // api.users (the property form), which honors rel: 'liveblog_users'.
        // The 'users:created' websocket push from LiveBlogUsersService.on_created
        // drives the list refresh — see the .run() listener below.
        $provide.decorator('usersService', ['$delegate', 'api',
            function($delegate, api) {
                $delegate.save = (user, data) => api.users.save(user, data);
                return $delegate;
            }]);
    }])
    .run(['$rootScope', '$location', function($rootScope, $location) {
        // Refetch the user list with the controller's current criteria so the
        // active filter (e.g. "All", "Pending") is preserved. UserListController
        // doesn't expose fetchUsers, but afterDelete() reuses it internally.
        // Event arrives via websocket push_notification from the backend
        // (LiveBlogUsersService.on_created).
        $rootScope.$on('users:created', () => {
            if ($location.path() !== '/users/') {
                return;
            }
            const listEl = document.querySelector('section.main-section.users');

            if (!listEl) {
                return;
            }
            const scope = angular.element(listEl).scope();

            if (scope && typeof scope.afterDelete === 'function') {
                scope.afterDelete({});
            }
        });
    }])
    .config(['apiProvider', function(apiProvider) {
        // Bind the 'users' resource alias to the tenant-isolated
        // liveblog_users backend. NOTE: this only redirects the property-form
        // api.users.* — the function-form api(...)/api.save('users', ...) still
        // resolves to /api/users, so callers must use api.users explicitly or
        // be patched via a $provide.decorator (see usersService above).
        apiProvider.api('users', {
            type: 'http',
            backend: {rel: 'liveblog_users'},
        });
        apiProvider.api('themes', {
            type: 'http',
            backend: {rel: 'themes'},
        });
        apiProvider.api('languages', {
            type: 'http',
            backend: {rel: 'languages'},
        });
        apiProvider.api('global_preferences', {
            type: 'http',
            backend: {rel: 'global_preferences'},
        });
        apiProvider.api('instance_settings', {
            type: 'http',
            backend: {rel: 'instance_settings'},
        });
    }])
    .directive('renderTagsComponent', [function() {
        return {
            scope: {
                tags: '=',
                onTagsChange: '=',
            },
            link: function(scope, element) {
                renderTagsManager($(element).get(0), scope.tags, scope.onTagsChange);
            },
        };
    }])
    .directive('aceEditor', [function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                var editor = ace.edit(element[0]);

                editor.setTheme('ace/theme/chrome');
                editor.session.setMode('ace/mode/json');
                editor.setFontSize(14);

                editor.on('change', () => {
                    const value = editor.getSession().getValue();

                    scope.$evalAsync(() => {
                        ngModel.$setViewValue(value);
                    });
                });

                ngModel.$render = () => {
                    let formattedJson = ngModel.$viewValue || '{}';

                    try {
                        formattedJson = JSON.stringify(JSON.parse(formattedJson), null, 4);
                    } catch (error) {
                        console.error('Invalid JSON', error);
                    }
                    editor.getSession().setValue(formattedJson);
                };
            },
        };
    }])
    .directive('lbSettingsView', lbSettingsView);

export default liveblogSettings;
