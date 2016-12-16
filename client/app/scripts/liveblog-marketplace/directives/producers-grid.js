liveblogMarketplace
    .directive('lbProducersGrid', ['api', function(api) {
        return {
            templateUrl: 'scripts/liveblog-marketplace/views/producers-grid.html',
            link: function(scope) {
                api.producers.query()
                    .then(function(producers) {
                        scope.producers = producers;
                    });
            }
        };
    }]);

