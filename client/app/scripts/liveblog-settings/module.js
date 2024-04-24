/* global ace */

import generalTpl from 'scripts/liveblog-settings/views/general.ng1';
import instanceTpl from 'scripts/liveblog-settings/views/instance-settings.ng1';
import LiveblogSettingsController from './controllers/general-settings.js';
import LiveblogInstanceSettingsController from './controllers/instance-settings.js';
import {renderTagsManager} from './components/tagsManager';
import {lbSettingsView} from './directives/lbSettingsView';

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
                liveblogSetting: true,
                privileges: {instance_settings: 1},
            });
    }])
    .config(['apiProvider', function(apiProvider) {
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
