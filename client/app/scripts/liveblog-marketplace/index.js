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
            });
    //}])
    //.config(['apiProvider', function(apiProvider) {
    //    apiProvider
    //        .api('mpBlogs', {
    //            type: 'http',
    //            backend: {rel: '/marketplace/blogs'}
    //        });
    }]);

