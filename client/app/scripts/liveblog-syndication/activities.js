activities.$inject = ['superdeskProvider'];

export default function activities(superdesk) {
    superdesk
        .activity('/consumers/', {
            label: gettext('Consumers Management'),
            controller: 'ConsumersController',
            templateUrl: 'scripts/liveblog-syndication/views/consumer-list.html',
            category: superdesk.MENU_MAIN,
            priority: 100,
            adminTools: true,
            resolve: {isArchivedFilterSelected: function() {return false;}}
        })
        .activity('/producers/', {
            label: gettext('Producers Management'),
            controller: 'ProducersController',
            templateUrl: 'scripts/liveblog-syndication/views/producer-list.html',
            category: superdesk.MENU_MAIN,
            priority: 100,
            adminTools: true,
            resolve: {isArchivedFilterSelected: function() {return false;}}
        });
};
