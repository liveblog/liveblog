import syndicationTpl from 'scripts/liveblog-syndication/views/syndication.html';

activities.$inject = ['superdeskProvider'];

export default function activities(superdesk) {
    superdesk
        .activity('/syndication/', {
            label: gettext('Syndication'),
            controller: 'SyndicationController',
            templateUrl: syndicationTpl,
            category: superdesk.MENU_MAIN,
            priority: 100,
            adminTools: true,
            resolve: {isArchivedFilterSelected: function() {return false;}}
        });
};
