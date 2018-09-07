import generalTpl from 'scripts/liveblog-settings/views/general.ng1';

(function() {
    LiveblogSettingsController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q'];
    function LiveblogSettingsController($scope, api, $location, notify, gettext, $q) {
        // prep the settings
        $scope.liveblogSettings = {language: {}, theme: {}};
        api.languages.query().then((data) => {
            $scope.languages = data._items;
        });
        api.themes.query().then((data) => {
            // filter theme with label (without label are `generic` from inheritance)
            $scope.themes = data._items.filter((theme) => angular.isDefined(theme.label));
        });
        $scope.settingsLoading = true;
        api.global_preferences.query().then((data) => {
            _.map(data._items, (setting) => {
                $scope.liveblogSettings[setting.key] = setting;
            });
            $scope.settingsLoading = false;
        });

        $scope.saveSettings = function() {
            notify.pop();
            notify.info(gettext('Saving settings'));
            let patch = {};
            const reqArr = [];

            _.map($scope.liveblogSettings, (item, key) => {
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
    const liveblogSettingsModule = angular.module('liveblog.settings', [])
        .config(['superdeskProvider', function(superdesk) {
            superdesk
                .activity('/settings/', {
                    label: gettext('Liveblog'),
                    controller: LiveblogSettingsController,
                    templateUrl: generalTpl,
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
        }]);

    return liveblogSettingsModule;
})();
