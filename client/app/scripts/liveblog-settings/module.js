(function() {
    'use strict';
    LiveblogSettingsController.$inject = ['$scope', 'api', '$location', 'notify', 'gettext', '$q'];
    function LiveblogSettingsController($scope, api, $location, notify, gettext, $q) {
        //prep the settings
        $scope.liveblogSettings = {'language': {}, 'theme': {}};
        $scope.settingsLoading = true;
        api.languages.query().then(function(data) {
            $scope.languages = [];
            _.map(data._items, function(language) {
                $scope.languages.push(language);
            });
        });
        api.themes.query().then(function(data) {
            $scope.themes = [];
            _.map(data._items, function(theme) {
                $scope.themes.push(theme);
            });
        });
        $scope.settingsLoading = true;
        api.global_preferences.query().then(function(data) {
            _.map(data._items, function(setting) {
                $scope.liveblogSettings[setting.key] = setting;
            });
            $scope.settingsLoading = false;
        });

        $scope.saveSettings = function() {
            notify.pop();
            notify.info(gettext('Saving settings'));
            var patch = {}, reqArr = [];
            _.map($scope.liveblogSettings, function(item, key) {
                patch = {
                    key: key,
                    value: item.value
                };
                reqArr.push(api('global_preferences').save(item, patch));
            });
            $q.all(reqArr).then(function() {
                notify.pop();
                notify.info(gettext('Settings saved'));
            }, function() {
                notify.pop();
                notify.error(gettext('Saving settings failed. Please try again later'));
            });
        };
        $scope.close = function() {
            //return to blog list page
            $location.path('/liveblog/');
        };
    }
    var liveblogSettingsModule = angular.module('liveblog.settings', [])
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/liveblog', {
                label: gettext('Liveblog'),
                controller: LiveblogSettingsController,
                templateUrl: 'scripts/liveblog-settings/views/general.html',
                category: superdesk.MENU_SETTINGS
            });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('themes', {
            type: 'http',
            backend: {rel: 'themes'}
        });
        apiProvider.api('languages', {
            type: 'http',
            backend: {rel: 'languages'}
        });
        apiProvider.api('global_preferences', {
            type: 'http',
            backend: {rel: 'global_preferences'}
        });
    }]);
    return liveblogSettingsModule;
})();
