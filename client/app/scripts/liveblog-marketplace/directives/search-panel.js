liveblogMarketplace
    .directive('lbSearchPanel', ['api', function(api) {
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

                scope.toggleFilter = function(name, value) {
                };

                //api.get('/marketplace/marketers')
                //    .then(function(marketers) {
                //        scope.marketers = marketers;
                //    });
            }
        };
    }]);
