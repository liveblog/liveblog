liveblogMarketplace
    .directive('lbMarketersGrid', ['api', '$location', function(api, $location) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/marketers-grid.html',
            link: function(scope) {
                scope.open = function(marketer) {
                    $location.path('/marketplace/marketers/' + marketer._id);
                };

                api.get('/marketplace/marketers')
                    .then(function(marketers) {
                        scope.marketers = marketers;
                    });
            }
        };
    }]);
