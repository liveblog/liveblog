liveblogMarketplace
    .directive('lbBlogsList', ['MarketplaceActions', function(MarketplaceActions) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/blogs-list.html',
            scope: {
                title: '@',
                blogs: '='
            },
            link: function(scope) {
                scope.openEmbedModal = MarketplaceActions.openEmbedModal;
            }
        }
    }]);
