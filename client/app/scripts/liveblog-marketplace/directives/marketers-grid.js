liveblogMarketplace
    .directive('lbMarketersGrid', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/marketers-grid.html',
            link: function(scope) {
                api.get('/marketplace/marketers')
                    .then(function(marketers) {
                        scope.marketers = marketers;
                    });
            }
        };
    }]);
