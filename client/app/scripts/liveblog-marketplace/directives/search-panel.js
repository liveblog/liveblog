liveblogMarketplace
    .directive('lbSearchPanel', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/search-panel.html',
            link: function(scope) {
                api.get('/marketplace/marketers')
                    .then(function(marketers) {
                        scope.marketers = marketers;
                        console.log(marketers);
                    });
            }
        };
    }]);
