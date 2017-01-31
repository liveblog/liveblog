liveblogMarketplace
    .directive('lbSearchPanel', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/search-panel.html',
            link: function(scope) {
                scope.categories = [
                    "Breaking News",
                    "Entertainment",
                    "Business and Finance",
                    "Sport",
                    "Technology"
                ];

                api.get('/marketplace/marketers')
                    .then(function(marketers) {
                        scope.marketers = marketers;
                    });
            }
        };
    }]);
