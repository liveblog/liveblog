var liveblogSyndication = angular
    .module('liveblog.syndication', ['liveblog.security']);

liveblogSyndication
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/syndication/', {
                label: gettext('Syndication'),
                controller: 'SyndicationController',
                templateUrl: 'scripts/liveblog-syndication/views/syndication.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            })
    }])
    .config(['apiProvider', function(apiProvider) {
        apiProvider
            .api('syndicationIn', {
                type: 'http',
                backend: {rel: 'syndication_in'}
            })
            .api('syndicationOut', {
                type: 'http',
                backend: {rel: 'syndication_out'}
            })
             .api('consumers', {
                type: 'http',
                backend: {rel: 'consumers'}
            })
            .api('producers', {
                type: 'http',
                backend: {rel: 'producers'}
            });
    }]);

