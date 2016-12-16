var liveblogMarketplace = angular.module('liveblog.marketplace', []);

liveblogMarketplace
    .config(['superdeskProvider', function(superdesk) {
        superdesk
            .activity('/marketplace/', {
                label: gettext('Marketplace'),
                controller: 'MarketplaceController',
                templateUrl: 'scripts/liveblog-marketplace/views/marketplace.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                adminTools: true,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            })
            .activity('/marketplace/:type/:id', {
                label: gettext('Marketplace'),
                controller: 'MarketerController',
                templateUrl: 'scripts/liveblog-marketplace/views/marketer.html',
                category: superdesk.MENU_MAIN,
                priority: 100,
                resolve: {isArchivedFilterSelected: function() {return false;}}
            //})
            //.activity('/marketplace/producers/:id', {
            //    label: gettext('Marketplace'),
            //    controller: 'MpProducerController',
            //    templateUrl: 'scripts/liveblog-marketplace/views/mp-producer.html',
            //    category: superdesk.MENU_MAIN,
            //    priority: 100,
            //    resolve: {isArchivedFilterSelected: function() {return false;}}
             });
    }]);
