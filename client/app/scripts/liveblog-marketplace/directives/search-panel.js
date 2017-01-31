liveblogMarketplace
    .directive('lbSearchPanel', ['MarketplaceActions', function(MarketplaceActions) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/search-panel.html',
            scope: {
                store: '='
            },
            link: function(scope) {
                scope.categories = [
                    "Breaking News",
                    "Entertainment",
                    "Business and Finance",
                    "Sport",
                    "Technology"
                ];

                scope.store.connect(function(state) {
                    scope.marketers = state.marketers;
                });

                scope.toggleFilter = MarketplaceActions.toggleFilter;
            }
        };
    }]);
