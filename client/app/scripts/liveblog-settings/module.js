(function() {
    'use strict';
    SettingsService.$inject = ['api', '$q'];
    function SettingsService(api, $q) {
        var service = {};
        service.getLanguages = function() {
            var languages = [
                {ID: 'en', name: 'english'},
                {ID: 'fr', name: 'french'},
                {ID: 'de', name: 'deutsch'}
            ];
            
            var deferred = $q.defer();
            // api.languages.query({}).then(function(data) {
            //     deferred.resolve(data);
            // }, function(message) {
            //     deferred.reject(message)
            // });
            deferred.resolve(languages);
            return deferred.promise;
        }

        service.getThemes = function() {
            var themes = {
                'no_theme': 'none',
                'ocean': 'blue',
                'forest': 'green'
            };
            var deferred = $q.defer();
            // api.themes.query({}).then(function(data) {
            //     deferred.resolve(data);
            // }, function(message) {
            //     deferred.reject(message)
            // });
            deferred.resolve(themes);
            return deferred.promise;
        }

        return service;
    };
    LiveblogSettingsController.$inject = ['$scope', 'settingsService'];
    function LiveblogSettingsController($scope, settingsService) {
        settingsService.getLanguages().then(function(data) {
            $scope.languages = data;
        });
        settingsService.getThemes().then(function(data) {
            $scope.themes = data;
        });
        console.log('$scope ', $scope);
    };
    var liveblogSettingsModule = angular.module('liveblog.settings', [])
    .service('settingsService', SettingsService)
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/settings/liveblog', {
                label: gettext('Liveblog'),
                controller: LiveblogSettingsController,
                templateUrl: 'scripts/liveblog-settings/views/general.html',
                category: superdesk.MENU_SETTINGS
            })
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
    }]);
    return liveblogSettingsModule;
})();