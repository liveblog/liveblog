angular
    .module('liveblog.consumers', ['liveblog.security'])
    .config(['superdeskProvider', function(superdesk) {
        superdesk.activity('/consumers', {
            label: gettext('Consumers Management'),
            controller: 'ConsumerController',
            templateUrl: 'scripts/liveblog-syndication/list.html',
            category: superdesk.MENU_SETTINGS,
            adminTools: false,
            resolve: {isArchivedFilterSelected: function() {return false;}}
        });
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider.api('consumers', {
            type: 'http',
            backend: {rel: 'consumers'}
        });
    }])
    .controller('ConsumerController', ['$scope', 'api', function($scope, api) {
        console.log('api', api.consumers);
        api.consumers.query().then(function(consumers) {
            console.log('consumers', consumers);
        });
    }]);
