import generalTpl from 'scripts/liveblog-settings/views/general.ng1';
import {renderTagsComponent} from './components/index';

LiveblogSettingsController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q'];
function LiveblogSettingsController($scope, api, $location, notify, gettext, $q) {
    // prep the settings
    $scope.settingsForm = null;
    $scope.liveblogSettings = {language: {}, theme: {}, global_tags: []};
    const allowedKeys = ['language', 'theme', 'global_tags'];

    api.languages.query().then((data) => {
        $scope.languages = data._items;
    });

    api.themes.query().then((data) => {
        // filter theme with label (without label are `generic` from inheritance)
        $scope.themes = data._items.filter((theme) => angular.isDefined(theme.label));
    });

    $scope.settingsLoading = true;

    api.global_preferences.query().then((data) => {
        _.forEach(data._items, (setting) => {
            $scope.liveblogSettings[setting.key] = setting;
        });
        $scope.settingsLoading = false;
    });

    $scope.setFormRef = function(childScope) {
        $scope.settingsForm = childScope.settingsForm;
    };

    $scope.onTagsChange = function(tags) {
        $scope.liveblogSettings.global_tags.value = tags;
        $scope.settingsForm.$setDirty();
        $scope.$apply();
    };

    $scope.saveSettings = function() {
        notify.pop();
        notify.info(gettext('Saving settings'));
        let patch = {};
        const reqArr = [];

        _.forEach($scope.liveblogSettings, (item, key) => {
            if (!_.includes(allowedKeys, key)) return;

            patch = {
                key: key,
                value: item.value,
            };
            reqArr.push(api('global_preferences').save(item, patch));
        });

        $q.all(reqArr).then(() => {
            notify.pop();
            notify.info(gettext('Settings saved'));
        }, () => {
            notify.pop();
            notify.error(gettext('Saving settings failed. Please try again later'));
        });
    };

    $scope.close = function() {
        // return to blog list page
        $location.path('/liveblog/');
    };
}

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
    }])
    .directive('renderTagsComponent', [function() {
        return {
            scope: {
                tags: '=',
                onTagsChange: '=',
            },
            link: function(scope, element) {
                renderTagsComponent($(element).get(0), scope.tags, scope.onTagsChange);
            },
        };
    }]);

export default liveblogSettings;
